import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

function asId(value:string|Stripe.PaymentIntent|null):string|null{
  if(!value) return null
  return typeof value==='string'?value:value.id
}

async function markEvent(admin:ReturnType<typeof createAdminClient>,eventId:string,status:'processed'|'ignored'|'failed',errorMessage?:string){
  await admin.from('stripe_webhook_events').update({
    processing_status:status,
    processed_at:new Date().toISOString(),
    error_message:errorMessage||null
  }).eq('event_id',eventId)
}

export async function POST(request:Request){
  const secret=process.env.STRIPE_SECRET_KEY
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET
  if(!secret||!webhookSecret) return NextResponse.json({error:'Stripe webhook is not configured.'},{status:503})

  const signature=request.headers.get('stripe-signature')
  if(!signature) return NextResponse.json({error:'Missing Stripe signature.'},{status:400})

  const stripe=new Stripe(secret)
  const rawBody=await request.text()
  let event:Stripe.Event
  try{
    event=stripe.webhooks.constructEvent(rawBody,signature,webhookSecret)
  }catch{
    return NextResponse.json({error:'Invalid Stripe signature.'},{status:400})
  }

  const admin=createAdminClient()
  const {error:claimError}=await admin.from('stripe_webhook_events').insert({event_id:event.id,event_type:event.type})
  if(claimError){
    if(claimError.code==='23505') return NextResponse.json({received:true,duplicate:true})
    return NextResponse.json({error:'Unable to claim webhook event.'},{status:500})
  }

  try{
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
      const session=event.data.object as Stripe.Checkout.Session
      if(session.payment_status!=='paid'){
        await markEvent(admin,event.id,'ignored')
        return NextResponse.json({received:true})
      }
      const orderId=session.metadata?.order_id||session.client_reference_id
      const attemptId=session.metadata?.payment_attempt_id
      if(!orderId){
        await markEvent(admin,event.id,'failed','missing_order_metadata')
        return NextResponse.json({error:'Checkout Session is missing order metadata.'},{status:400})
      }

      const {data:order,error:orderError}=await admin.from('orders').select('id,total,currency,status').eq('id',orderId).single()
      if(orderError||!order){
        await markEvent(admin,event.id,'failed','order_not_found')
        return NextResponse.json({error:'Order not found.'},{status:404})
      }

      const attemptMatch=attemptId
        ? admin.from('payment_attempts').update({status:'failed',failure_code:'amount_mismatch',updated_at:new Date().toISOString()}).eq('id',attemptId)
        : admin.from('payment_attempts').update({status:'failed',failure_code:'amount_mismatch',updated_at:new Date().toISOString()}).eq('provider','stripe').eq('provider_order_id',session.id)

      const expected=Math.round(Number(order.total)*100)
      const expectedCurrency=String(order.currency||'INR').trim().toLowerCase()
      if(session.amount_total===null||session.amount_total!==expected||session.currency?.toLowerCase()!==expectedCurrency){
        await attemptMatch
        await markEvent(admin,event.id,'failed','amount_or_currency_mismatch')
        return NextResponse.json({error:'Payment amount or currency mismatch.'},{status:409})
      }

      const paymentIntentId=asId(session.payment_intent)
      const paymentUpdate={status:'captured',provider_order_id:session.id,provider_payment_id:paymentIntentId,updated_at:new Date().toISOString()}
      const {error:paymentError}=attemptId
        ? await admin.from('payment_attempts').update(paymentUpdate).eq('id',attemptId).eq('order_id',orderId).eq('provider','stripe')
        : await admin.from('payment_attempts').update(paymentUpdate).eq('provider','stripe').eq('provider_order_id',session.id).eq('order_id',orderId)
      if(paymentError){
        await markEvent(admin,event.id,'failed','payment_reconciliation_failed')
        return NextResponse.json({error:'Payment reconciliation failed.'},{status:500})
      }

      if(order.status==='pending'){
        const {error:orderUpdateError}=await admin.from('orders').update({status:'paid',payment_provider:'stripe',payment_reference:paymentIntentId||session.id,updated_at:new Date().toISOString()}).eq('id',orderId).eq('status','pending')
        if(orderUpdateError){
          await markEvent(admin,event.id,'failed','order_reconciliation_failed')
          return NextResponse.json({error:'Order reconciliation failed.'},{status:500})
        }
      }

      await markEvent(admin,event.id,'processed')
      return NextResponse.json({received:true})
    }

    await markEvent(admin,event.id,'ignored')
    return NextResponse.json({received:true})
  }catch(error){
    const message=error instanceof Error?error.message:'unknown_webhook_error'
    await markEvent(admin,event.id,'failed',message.slice(0,500))
    return NextResponse.json({error:'Webhook processing failed.'},{status:500})
  }
}
