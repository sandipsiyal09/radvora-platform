import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'
const STALE_AFTER_MS=5*60*1000
const MAX_BODY_BYTES=256*1024

type RazorpayPayment={id?:string;order_id?:string;amount?:number;currency?:string;status?:string}
type RazorpayRefund={id?:string;payment_id?:string;amount?:number;currency?:string;status?:string;notes?:Record<string,unknown>}
type RazorpayPaymentLink={id?:string;amount?:number;amount_paid?:number;currency?:string;status?:string;reference_id?:string;expire_by?:number;order_id?:string;notes?:Record<string,unknown>}
type RazorpayEvent={event?:string;payload?:{payment?:{entity?:RazorpayPayment};refund?:{entity?:RazorpayRefund};payment_link?:{entity?:RazorpayPaymentLink}}}

type AdminClient=ReturnType<typeof createAdminClient>
function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function safeEqualHex(expected:string,received:string){try{const a=Buffer.from(expected,'hex');const b=Buffer.from(received,'hex');return a.length===b.length&&a.length>0&&timingSafeEqual(a,b)}catch{return false}}

async function markEvent(admin:AdminClient,eventId:string,status:'processed'|'ignored'|'failed',errorMessage?:string){await admin.from('payment_webhook_events').update({processing_status:status,processed_at:new Date().toISOString(),error_message:errorMessage||null}).eq('provider','razorpay').eq('event_id',eventId)}
async function claimEvent(admin:AdminClient,eventId:string,eventType:string){
  const {error:insertError}=await admin.from('payment_webhook_events').insert({provider:'razorpay',event_id:eventId,event_type:eventType})
  if(!insertError)return {claimed:true as const}
  if(insertError.code!=='23505')return {claimed:false as const,status:500,error:'Unable to claim webhook event.'}
  const {data:existing,error}=await admin.from('payment_webhook_events').select('processing_status,received_at').eq('provider','razorpay').eq('event_id',eventId).single()
  if(error||!existing)return {claimed:false as const,status:500,error:'Unable to inspect webhook event.'}
  if(existing.processing_status==='processed'||existing.processing_status==='ignored')return {claimed:false as const,status:200,duplicate:true as const}
  const staleBefore=new Date(Date.now()-STALE_AFTER_MS).toISOString()
  if(existing.processing_status==='received'){const received=Date.parse(existing.received_at);if(!Number.isFinite(received)||Date.now()-received<STALE_AFTER_MS)return {claimed:false as const,status:503,error:'Webhook event is already being processed.'}}
  const query=admin.from('payment_webhook_events').update({processing_status:'received',received_at:new Date().toISOString(),processed_at:null,error_message:null}).eq('provider','razorpay').eq('event_id',eventId).in('processing_status',['failed','received'])
  const {data:reclaimed,error:reclaimError}=existing.processing_status==='received'?await query.lt('received_at',staleBefore).select('event_id').maybeSingle():await query.select('event_id').maybeSingle()
  if(reclaimError)return {claimed:false as const,status:500,error:'Unable to reclaim webhook event.'}
  if(!reclaimed)return {claimed:false as const,status:503,error:'Webhook event is already being retried.'}
  return {claimed:true as const}
}

async function lookupPaymentLinkAttempt(admin:AdminClient,link:RazorpayPaymentLink){
  const reference=String(link.reference_id||'')
  if(!link.id||!reference)return null
  const {data,error}=await admin.from('payment_attempts').select('id,order_id,amount,currency,status,provider_session_id,provider_payment_id').eq('id',reference).eq('provider','razorpay').maybeSingle()
  if(error||!data)return null
  if(data.provider_session_id&&data.provider_session_id!==link.id)return null
  const noteAttempt=String(link.notes?.payment_attempt_id||'')
  const noteOrder=String(link.notes?.radvora_order_id||'')
  if(noteAttempt&&noteAttempt!==data.id)return null
  if(noteOrder&&noteOrder!==data.order_id)return null
  return data
}

async function processPaymentLinkPaid(admin:AdminClient,eventId:string,link:RazorpayPaymentLink,payment:RazorpayPayment){
  try{
    if(!link.id||link.status!=='paid'||!Number.isSafeInteger(link.amount)||Number(link.amount)<=0||link.amount_paid!==link.amount||String(link.currency||'').toUpperCase()!=='INR')throw new Error('Invalid paid Payment Link payload')
    if(!payment.id||payment.status!=='captured'||!Number.isSafeInteger(payment.amount)||String(payment.currency||'').toUpperCase()!=='INR')throw new Error('Invalid captured payment payload')
    const attempt=await lookupPaymentLinkAttempt(admin,link);if(!attempt)throw new Error('Payment attempt not found')
    const expectedPaise=Math.round(Number(attempt.amount)*100)
    if(expectedPaise!==link.amount||expectedPaise!==payment.amount||attempt.currency!=='INR')throw new Error('Payment Link amount or currency mismatch')
    if(attempt.status==='captured'&&attempt.provider_payment_id===payment.id){await markEvent(admin,eventId,'processed');return json({ok:true,alreadyProcessed:true})}
    if(attempt.status!=='pending'&&attempt.status!=='created')throw new Error('Payment attempt is not payable')

    const {error:bindError}=await admin.from('payment_attempts').update({provider_session_id:link.id,provider_order_id:link.order_id||payment.order_id||null,provider_payment_id:null,status:'pending',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',attempt.order_id).eq('provider','razorpay').in('status',['created','pending'])
    if(bindError)throw bindError
    const {error:finalizeError}=await admin.rpc('finalize_razorpay_payment',{p_order_id:attempt.order_id,p_attempt_id:attempt.id,p_payment_id:payment.id})
    if(finalizeError)throw finalizeError
    await markEvent(admin,eventId,'processed')
    return json({ok:true})
  }catch(error){console.error('razorpay_payment_link_paid_failed',error);await markEvent(admin,eventId,'failed','Payment Link paid reconciliation failed');return json({error:'Webhook processing failed.'},500)}
}

async function processPaymentLinkClosed(admin:AdminClient,eventId:string,eventType:'payment_link.cancelled'|'payment_link.expired',link:RazorpayPaymentLink){
  try{
    const expectedStatus=eventType==='payment_link.cancelled'?'cancelled':'expired'
    if(!link.id||link.status!==expectedStatus||Number(link.amount_paid||0)!==0||String(link.currency||'').toUpperCase()!=='INR')throw new Error('Invalid closed Payment Link payload')
    const attempt=await lookupPaymentLinkAttempt(admin,link);if(!attempt)throw new Error('Payment attempt not found')
    const expectedPaise=Math.round(Number(attempt.amount)*100)
    if(expectedPaise!==link.amount||attempt.currency!=='INR')throw new Error('Closed Payment Link amount mismatch')
    if(attempt.status==='captured'||attempt.provider_payment_id)throw new Error('Captured payment cannot be released')
    const {error}=await admin.rpc('close_razorpay_payment_link_attempt',{p_attempt_id:attempt.id,p_session_id:link.id,p_reason:eventType==='payment_link.cancelled'?'payment_link_cancelled':'payment_link_expired'})
    if(error)throw error
    await markEvent(admin,eventId,'processed')
    return json({ok:true,status:expectedStatus})
  }catch(error){console.error('razorpay_payment_link_close_failed',error);await markEvent(admin,eventId,'failed','Payment Link close reconciliation failed');return json({error:'Webhook processing failed.'},500)}
}

async function processLegacyCapturedPayment(admin:AdminClient,eventId:string,payment:RazorpayPayment){
  const paymentId=payment.id||'';const providerOrderId=payment.order_id||''
  if(!paymentId||!providerOrderId||payment.status!=='captured'||String(payment.currency).toUpperCase()!=='INR'||!Number.isSafeInteger(payment.amount)||Number(payment.amount)<=0){await markEvent(admin,eventId,'failed','Invalid legacy captured payment payload');return json({error:'Invalid payment payload.'},400)}
  try{
    const {data:attempt,error}=await admin.from('payment_attempts').select('id,order_id,amount,currency,status,provider_payment_id').eq('provider','razorpay').eq('provider_order_id',providerOrderId).maybeSingle()
    if(error||!attempt)throw new Error('Payment attempt not found')
    if(Math.round(Number(attempt.amount)*100)!==payment.amount||attempt.currency!=='INR')throw new Error('Payment amount or currency mismatch')
    if(attempt.status==='captured'&&attempt.provider_payment_id===paymentId){await markEvent(admin,eventId,'processed');return json({ok:true,alreadyProcessed:true})}
    if(attempt.status!=='pending')throw new Error('Payment attempt is not pending')
    const {error:finalizeError}=await admin.rpc('finalize_razorpay_payment',{p_order_id:attempt.order_id,p_attempt_id:attempt.id,p_payment_id:paymentId});if(finalizeError)throw finalizeError
    await markEvent(admin,eventId,'processed');return json({ok:true,legacy:true})
  }catch(error){console.error('razorpay_legacy_payment_webhook_failed',error);await markEvent(admin,eventId,'failed','Legacy payment reconciliation failed');return json({error:'Webhook processing failed.'},500)}
}

async function processRefund(admin:AdminClient,eventId:string,eventType:string,refund:RazorpayRefund){
  const refundId=refund.id||'';const paymentId=refund.payment_id||'';const providerStatus=String(refund.status||'');const amountPaise=refund.amount
  if(!refundId||!paymentId||!Number.isSafeInteger(amountPaise)||Number(amountPaise)<=0||String(refund.currency).toUpperCase()!=='INR'){await markEvent(admin,eventId,'failed','Invalid refund payload');return json({error:'Invalid refund payload.'},400)}
  if(eventType==='refund.processed'&&providerStatus!=='processed'||eventType==='refund.failed'&&providerStatus!=='failed'){await markEvent(admin,eventId,'failed','Refund status mismatch');return json({error:'Invalid refund status.'},400)}
  try{
    let refundAttempt:null|{id:string;payment_attempt_id:string;order_id:string;amount:number|string;currency:string;status:string}=null
    const {data:byProvider,error:providerLookupError}=await admin.from('refund_attempts').select('id,payment_attempt_id,order_id,amount,currency,status').eq('provider','razorpay').eq('provider_refund_id',refundId).maybeSingle();if(providerLookupError)throw providerLookupError;refundAttempt=byProvider
    if(!refundAttempt){const noteAttemptId=typeof refund.notes?.refund_attempt_id==='string'?refund.notes.refund_attempt_id:'';if(noteAttemptId){const {data:byNote,error:noteLookupError}=await admin.from('refund_attempts').select('id,payment_attempt_id,order_id,amount,currency,status').eq('id',noteAttemptId).eq('provider','razorpay').maybeSingle();if(noteLookupError)throw noteLookupError;refundAttempt=byNote}}
    if(!refundAttempt)throw new Error('Refund attempt not found')
    const {data:payment,error:paymentError}=await admin.from('payment_attempts').select('id,provider_payment_id,amount,currency,status').eq('id',refundAttempt.payment_attempt_id).eq('provider','razorpay').maybeSingle();if(paymentError||!payment)throw new Error('Refund payment attempt not found')
    if(payment.provider_payment_id!==paymentId)throw new Error('Refund payment id mismatch')
    if(Math.round(Number(refundAttempt.amount)*100)!==amountPaise||Math.round(Number(payment.amount)*100)!==amountPaise||refundAttempt.currency!=='INR'||payment.currency!=='INR')throw new Error('Refund amount or currency mismatch')
    if(refundAttempt.status==='processed'&&eventType==='refund.processed'){await markEvent(admin,eventId,'processed');return json({ok:true,alreadyProcessed:true})}
    const targetStatus=eventType==='refund.processed'?'processed':'failed'
    const {error:finalizeError}=await admin.rpc('finalize_razorpay_refund',{p_refund_attempt_id:refundAttempt.id,p_provider_refund_id:refundId,p_status:targetStatus,p_failure_code:targetStatus==='failed'?'provider_refund_failed':null});if(finalizeError)throw finalizeError
    await markEvent(admin,eventId,'processed');return json({ok:true,status:targetStatus})
  }catch(error){console.error('razorpay_refund_webhook_processing_failed',error);await markEvent(admin,eventId,'failed','Refund reconciliation failed');return json({error:'Webhook processing failed.'},500)}
}

export async function POST(request:Request){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET?.trim();if(!secret)return json({error:'Webhook is not configured.'},503)
  const signature=request.headers.get('x-razorpay-signature')?.trim()||'';const eventId=request.headers.get('x-razorpay-event-id')?.trim()||''
  if(!signature||!eventId||eventId.length>200)return json({error:'Invalid webhook request.'},400)
  const rawLength=request.headers.get('content-length');if(rawLength&&Number(rawLength)>MAX_BODY_BYTES)return json({error:'Webhook payload is too large.'},413)
  const rawBytes=await request.arrayBuffer();if(rawBytes.byteLength>MAX_BODY_BYTES)return json({error:'Webhook payload is too large.'},413)
  const rawBuffer=Buffer.from(rawBytes);const expected=createHmac('sha256',secret).update(rawBuffer).digest('hex');if(!safeEqualHex(expected,signature))return json({error:'Invalid webhook signature.'},400)
  let event:RazorpayEvent;try{event=JSON.parse(rawBuffer.toString('utf8'))}catch{return json({error:'Invalid webhook payload.'},400)}
  const eventType=String(event.event||'unknown').slice(0,120);const admin=createAdminClient();const claim=await claimEvent(admin,eventId,eventType)
  if(!claim.claimed){if('duplicate' in claim&&claim.duplicate)return json({ok:true,duplicate:true});return json({error:claim.error},claim.status)}

  if(eventType==='payment_link.paid'){
    const link=event.payload?.payment_link?.entity;const payment=event.payload?.payment?.entity
    if(!link||!payment){await markEvent(admin,eventId,'failed','Missing paid Payment Link payload');return json({error:'Invalid payment payload.'},400)}
    return processPaymentLinkPaid(admin,eventId,link,payment)
  }
  if(eventType==='payment_link.cancelled'||eventType==='payment_link.expired'){
    const link=event.payload?.payment_link?.entity
    if(!link){await markEvent(admin,eventId,'failed','Missing closed Payment Link payload');return json({error:'Invalid payment link payload.'},400)}
    return processPaymentLinkClosed(admin,eventId,eventType,link)
  }
  if(eventType==='payment.captured'){
    const payment=event.payload?.payment?.entity
    if(!payment){await markEvent(admin,eventId,'failed','Missing captured payment payload');return json({error:'Invalid payment payload.'},400)}
    return processLegacyCapturedPayment(admin,eventId,payment)
  }
  if(eventType==='refund.processed'||eventType==='refund.failed'){
    const refund=event.payload?.refund?.entity
    if(!refund){await markEvent(admin,eventId,'failed','Missing refund payload');return json({error:'Invalid refund payload.'},400)}
    return processRefund(admin,eventId,eventType,refund)
  }
  await markEvent(admin,eventId,'ignored');return json({ok:true,ignored:true})
}
