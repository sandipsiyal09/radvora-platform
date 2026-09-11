import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

const STALE_AFTER_MS=5*60*1000

type RazorpayPayment={id?:string;order_id?:string;amount?:number;currency?:string;status?:string}
type RazorpayEvent={event?:string;payload?:{payment?:{entity?:RazorpayPayment}}}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function safeEqualHex(expected:string,received:string){
  try{
    const a=Buffer.from(expected,'hex')
    const b=Buffer.from(received,'hex')
    return a.length===b.length&&a.length>0&&timingSafeEqual(a,b)
  }catch{return false}
}

async function markEvent(admin:ReturnType<typeof createAdminClient>,eventId:string,status:'processed'|'ignored'|'failed',errorMessage?:string){
  await admin.from('payment_webhook_events').update({processing_status:status,processed_at:new Date().toISOString(),error_message:errorMessage||null}).eq('provider','razorpay').eq('event_id',eventId)
}

async function claimEvent(admin:ReturnType<typeof createAdminClient>,eventId:string,eventType:string){
  const {error:insertError}=await admin.from('payment_webhook_events').insert({provider:'razorpay',event_id:eventId,event_type:eventType})
  if(!insertError) return {claimed:true as const}
  if(insertError.code!=='23505') return {claimed:false as const,status:500,error:'Unable to claim webhook event.'}

  const {data:existing,error}=await admin.from('payment_webhook_events').select('processing_status,received_at').eq('provider','razorpay').eq('event_id',eventId).single()
  if(error||!existing) return {claimed:false as const,status:500,error:'Unable to inspect webhook event.'}
  if(existing.processing_status==='processed'||existing.processing_status==='ignored') return {claimed:false as const,status:200,duplicate:true as const}

  const staleBefore=new Date(Date.now()-STALE_AFTER_MS).toISOString()
  if(existing.processing_status==='received'){
    const received=Date.parse(existing.received_at)
    if(!Number.isFinite(received)||Date.now()-received<STALE_AFTER_MS) return {claimed:false as const,status:503,error:'Webhook event is already being processed.'}
  }

  const query=admin.from('payment_webhook_events').update({processing_status:'received',received_at:new Date().toISOString(),processed_at:null,error_message:null}).eq('provider','razorpay').eq('event_id',eventId).in('processing_status',['failed','received'])
  const {data:reclaimed,error:reclaimError}=existing.processing_status==='received'
    ? await query.lt('received_at',staleBefore).select('event_id').maybeSingle()
    : await query.select('event_id').maybeSingle()
  if(reclaimError) return {claimed:false as const,status:500,error:'Unable to reclaim webhook event.'}
  if(!reclaimed) return {claimed:false as const,status:503,error:'Webhook event is already being retried.'}
  return {claimed:true as const}
}

export async function POST(request:Request){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  if(!secret) return json({error:'Webhook is not configured.'},503)

  const signature=request.headers.get('x-razorpay-signature')?.trim()||''
  const eventId=request.headers.get('x-razorpay-event-id')?.trim()||''
  if(!signature||!eventId||eventId.length>200) return json({error:'Invalid webhook request.'},400)

  const rawBody=await request.text()
  const expected=createHmac('sha256',secret).update(rawBody).digest('hex')
  if(!safeEqualHex(expected,signature)) return json({error:'Invalid webhook signature.'},400)

  let event:RazorpayEvent
  try{event=JSON.parse(rawBody)}catch{return json({error:'Invalid webhook payload.'},400)}
  const eventType=String(event.event||'unknown').slice(0,120)
  const admin=createAdminClient()
  const claim=await claimEvent(admin,eventId,eventType)
  if(!claim.claimed){
    if('duplicate' in claim&&claim.duplicate) return json({ok:true,duplicate:true})
    return json({error:claim.error},claim.status)
  }

  if(eventType!=='payment.captured'){
    await markEvent(admin,eventId,'ignored')
    return json({ok:true,ignored:true})
  }

  const payment=event.payload?.payment?.entity
  const paymentId=payment?.id||''
  const providerOrderId=payment?.order_id||''
  if(!paymentId||!providerOrderId||payment.status!=='captured'||String(payment.currency).toUpperCase()!=='INR'||!Number.isSafeInteger(payment.amount)||Number(payment.amount)<=0){
    await markEvent(admin,eventId,'failed','Invalid captured payment payload')
    return json({error:'Invalid payment payload.'},400)
  }

  try{
    const {data:attempt,error:attemptError}=await admin.from('payment_attempts')
      .select('id,order_id,amount,currency,status,provider_payment_id')
      .eq('provider','razorpay').eq('provider_order_id',providerOrderId).maybeSingle()
    if(attemptError||!attempt) throw new Error('Payment attempt not found')

    const expectedPaise=Math.round(Number(attempt.amount)*100)
    if(expectedPaise!==payment.amount||String(attempt.currency).toUpperCase()!=='INR') throw new Error('Payment amount or currency mismatch')

    if(attempt.status==='captured'&&attempt.provider_payment_id===paymentId){
      await markEvent(admin,eventId,'processed')
      return json({ok:true,alreadyProcessed:true})
    }
    if(attempt.status!=='pending') throw new Error('Payment attempt is not pending')

    const {error:finalizeError}=await admin.rpc('finalize_razorpay_payment',{
      p_order_id:attempt.order_id,
      p_attempt_id:attempt.id,
      p_payment_id:paymentId
    })
    if(finalizeError) throw finalizeError

    await markEvent(admin,eventId,'processed')
    return json({ok:true})
  }catch(error){
    console.error('razorpay_webhook_processing_failed',error)
    await markEvent(admin,eventId,'failed','Payment reconciliation failed')
    return json({error:'Webhook processing failed.'},500)
  }
}
