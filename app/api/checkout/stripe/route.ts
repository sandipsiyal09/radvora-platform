import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

const MAX_CHECKOUT_BODY_BYTES=4096

type CheckoutBody={orderId?:string}
type ActiveAttempt={id:string;provider_order_id:string|null;status:string;updated_at:string}

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

function requestBoundaryError(request:Request){
  const fetchSite=request.headers.get('sec-fetch-site')?.toLowerCase()
  if(fetchSite==='cross-site') return json({error:'Cross-site checkout requests are not allowed.'},403)

  const rawLength=request.headers.get('content-length')
  if(rawLength){
    const contentLength=Number(rawLength)
    if(Number.isFinite(contentLength)&&contentLength>MAX_CHECKOUT_BODY_BYTES){
      return json({error:'Checkout request is too large.'},413)
    }
  }

  const origin=request.headers.get('origin')
  if(origin){
    try{
      const requestOrigin=new URL(request.url).origin
      const configuredOrigin=getAppOrigin(request)
      const suppliedOrigin=new URL(origin).origin
      if(suppliedOrigin!==requestOrigin&&suppliedOrigin!==configuredOrigin){
        return json({error:'Invalid checkout request origin.'},403)
      }
    }catch{
      return json({error:'Invalid checkout request origin.'},403)
    }
  }

  return null
}

export async function POST(request:Request){
  const boundaryError=requestBoundaryError(request)
  if(boundaryError) return boundaryError

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
  const stripe=new Stripe(secret)

  const {data:existing,error:existingError}=await admin
    .from('payment_attempts')
    .select('id,provider_order_id,status,updated_at')
    .eq('order_id',order.id)
    .eq('provider','stripe')
    .in('status',['created','pending'])
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle<ActiveAttempt>()

  if(existingError){
    console.error('Unable to inspect existing Stripe checkout attempt',existingError)
    return json({error:'Unable to verify checkout state safely.'},500)
  }

  if(existing){
    if(existing.provider_order_id){
      try{
        const session=await stripe.checkout.sessions.retrieve(existing.provider_order_id)
        if(session.status==='open'&&session.url){
          return json({url:session.url,orderId:order.id,reused:true})
        }
        if(session.status==='complete'||session.payment_status==='paid'){
          return json({error:'Payment confirmation is already being processed for this order.',orderId:order.id,retryable:false},409)
        }

        const {error:closeError}=await admin
          .from('payment_attempts')
          .update({status:'failed',failure_code:`stripe_session_${session.status||'closed'}`,updated_at:new Date().toISOString()})
          .eq('id',existing.id)
          .eq('order_id',order.id)
          .eq('provider','stripe')
          .in('status',['created','pending'])
        if(closeError){
          console.error('Unable to close inactive Stripe checkout attempt',closeError)
          return json({error:'Unable to refresh checkout state safely.'},500)
        }
      }catch(error){
        console.error('Unable to retrieve existing Stripe checkout session',error)
        return json({error:'Unable to verify the existing secure checkout session. Please retry shortly.',orderId:order.id,retryable:true},502)
      }
    }else{
      const ageMs=Date.now()-new Date(existing.updated_at).getTime()
      if(Number.isFinite(ageMs)&&ageMs<120000){
        return json({error:'Checkout is already being initialized. Please retry shortly.',orderId:order.id,retryable:true},409)
      }

      const {error:staleError}=await admin
        .from('payment_attempts')
        .update({status:'failed',failure_code:'stale_checkout_initialization',updated_at:new Date().toISOString()})
        .eq('id',existing.id)
        .eq('order_id',order.id)
        .eq('provider','stripe')
        .eq('status','created')
      if(staleError){
        console.error('Unable to close stale Stripe checkout attempt',staleError)
        return json({error:'Unable to refresh checkout state safely.'},500)
      }
    }
  }

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({
    order_id:order.id,
    provider:'stripe',
    status:'created',
    amount:order.total,
    currency:currency.toUpperCase()
  }).select('id').single()
  if(attemptError||!attempt){
    if(attemptError?.code==='23505'){
      return json({error:'Checkout is already being initialized for this order. Please retry shortly.',orderId:order.id,retryable:true},409)
    }
    if(attemptError) console.error('Unable to initialize payment attempt',attemptError)
    return json({error:'Unable to initialize payment tracking.'},500)
  }

  try{
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
    },{idempotencyKey:`radvora-checkout-${attempt.id}`})

    const {error:linkError}=await admin.from('payment_attempts').update({provider_order_id:session.id,status:'pending',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','stripe').eq('status','created')
    if(linkError){
      console.error('Unable to link Stripe session to payment attempt',linkError)
      return json({error:'Payment session could not be finalized safely. Please retry from the order page.',orderId:order.id,retryable:true},500)
    }

    return json({url:session.url,orderId:order.id})
  }catch(error){
    await admin.from('payment_attempts').update({status:'failed',failure_code:'stripe_session_error',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','stripe')
    console.error('Stripe checkout session creation failed',error)
    return json({error:'Unable to start secure checkout. Please retry.',orderId:order.id,retryable:true},502)
  }
}
