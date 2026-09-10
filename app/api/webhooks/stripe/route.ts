import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

function asId(value:string|Stripe.PaymentIntent|null):string|null{
  if(!value) return null
  return typeof value==='string'?value:value.id
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

  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
    const session=event.data.object as Stripe.Checkout.Session
    if(session.payment_status!=='paid') return NextResponse.json({received:true})
    const orderId=session.metadata?.order_id||session.client_reference_id
    const attemptId=session.metadata?.payment_attempt_id
    if(!orderId) return NextResponse.json({error:'Checkout Session is missing order metadata.'},{status:400})

    const admin=createAdminClient()
    const {data:order,error:orderError}=await admin.from('orders').select('id,total,currency,status').eq('id',orderId).single()
    if(orderError||!order) return NextResponse.json({error:'Order not found.'},{status:404})

    const attemptMatch=attemptId
      ? admin.from('payment_attempts').update({status:'failed',failure_code:'amount_mismatch',updated_at:new Date().toISOString()}).eq('id',attemptId)
      : admin.from('payment_attempts').update({status:'failed',failure_code:'amount_mismatch',updated_at:new Date().toISOString()}).eq('provider','stripe').eq('provider_order_id',session.id)

    const expected=Math.round(Number(order.total)*100)
    if(session.amount_total===null||session.amount_total!==expected){
      await attemptMatch
      return NextResponse.json({error:'Payment amount mismatch.'},{status:409})
    }

    const paymentIntentId=asId(session.payment_intent)
    const paymentUpdate={status:'captured',provider_order_id:session.id,provider_payment_id:paymentIntentId,updated_at:new Date().toISOString()}
    const {error:paymentError}=attemptId
      ? await admin.from('payment_attempts').update(paymentUpdate).eq('id',attemptId)
      : await admin.from('payment_attempts').update(paymentUpdate).eq('provider','stripe').eq('provider_order_id',session.id)
    if(paymentError) return NextResponse.json({error:'Payment reconciliation failed.'},{status:500})

    if(order.status==='pending'){
      const {error:orderUpdateError}=await admin.from('orders').update({status:'paid',payment_provider:'stripe',payment_reference:paymentIntentId||session.id,updated_at:new Date().toISOString()}).eq('id',orderId).eq('status','pending')
      if(orderUpdateError) return NextResponse.json({error:'Order reconciliation failed.'},{status:500})
    }
  }

  return NextResponse.json({received:true})
}
