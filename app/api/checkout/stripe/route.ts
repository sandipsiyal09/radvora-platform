import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

type CheckoutBody={orderId?:string}

function json(body:Record<string,unknown>,status=200){
  return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
}

function getAppOrigin(request:Request){
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim()
  if(configured){
    try{
      const url=new URL(configured)
      if(url.protocol==='https:'||(process.env.NODE_ENV!=='production'&&url.protocol==='http:')) return url.origin
    }catch{/* fall back to request origin */}
  }
  return new URL(request.url).origin
}

export async function POST(request:Request){
  const secret=process.env.STRIPE_SECRET_KEY
  if(!secret) return json({error:'Secure checkout is temporarily unavailable.'},503)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)

  let body:CheckoutBody={}
  try{body=await request.json()}catch{/* cart checkout has no body */}

  let order:any
  if(body.orderId){
    const {data,error}=await supabase.from('orders').select('id,order_number,total,currency,status').eq('id',body.orderId).eq('user_id',user.id).maybeSingle()
    if(error||!data) return json({error:'Order not found.'},404)
    if(data.status!=='pending') return json({error:'Only pending orders can be retried.'},409)
    const {data:paidAttempt}=await supabase.from('payment_attempts').select('id').eq('order_id',data.id).in('status',['authorized','captured']).limit(1).maybeSingle()
    if(paidAttempt) return json({error:'A successful payment already exists for this order.'},409)
    order=data
  }else{
    const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart')
    if(orderError){
      console.error('checkout_active_cart failed',orderError)
      return json({error:'Unable to create order.'},400)
    }
    order=Array.isArray(orderData)?orderData[0]:orderData
    if(!order?.id) return json({error:'Unable to create order.'},400)
  }

  const {data:items,error:itemsError}=await supabase
    .from('order_items')
    .select('quantity,unit_price,line_total,product_id,products(name)')
    .eq('order_id',order.id)
  if(itemsError||!items?.length){
    if(itemsError) console.error('Unable to load checkout order items',itemsError)
    return json({error:'Order items could not be loaded.'},400)
  }

  const currency=String(order.currency||'INR').trim().toLowerCase()
  if(!/^[a-z]{3}$/.test(currency)) return json({error:'Order currency is invalid.'},400)

  const admin=createAdminClient()
  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({
    order_id:order.id,
    provider:'stripe',
    status:'created',
    amount:order.total,
    currency:currency.toUpperCase()
  }).select('id').single()
  if(attemptError||!attempt){
    if(attemptError) console.error('Unable to initialize payment attempt',attemptError)
    return json({error:'Unable to initialize payment tracking.'},500)
  }

  try{
    const stripe=new Stripe(secret)
    const origin=getAppOrigin(request)
    const session=await stripe.checkout.sessions.create({
      mode:'payment',
      customer_email:user.email||undefined,
      client_reference_id:order.id,
      metadata:{order_id:order.id,order_number:order.order_number,user_id:user.id,payment_attempt_id:attempt.id},
      shipping_address_collection:{allowed_countries:['IN']},
      phone_number_collection:{enabled:true},
      line_items:items.map((item:any)=>({
        quantity:item.quantity,
        price_data:{
          currency,
          unit_amount:Math.round(Number(item.unit_price)*100),
          product_data:{name:item.products?.name||'RADVORA Product'}
        }
      })),
      success_url:`${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/account/orders/${order.id}`
    })

    const {error:linkError}=await admin.from('payment_attempts').update({provider_order_id:session.id,status:'pending',updated_at:new Date().toISOString()}).eq('id',attempt.id)
    if(linkError){
      console.error('Unable to link Stripe session to payment attempt',linkError)
      return json({error:'Payment session could not be finalized safely. Please retry from the order page.',orderId:order.id,retryable:true},500)
    }

    return json({url:session.url,orderId:order.id})
  }catch(error){
    await admin.from('payment_attempts').update({status:'failed',failure_code:'stripe_session_error',updated_at:new Date().toISOString()}).eq('id',attempt.id)
    console.error('Stripe checkout session creation failed',error)
    return json({error:'Unable to start secure checkout. Please retry.',orderId:order.id,retryable:true},502)
  }
}
