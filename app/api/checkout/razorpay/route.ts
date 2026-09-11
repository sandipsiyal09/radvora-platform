import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

const MAX_BODY_BYTES=8192
const PIN_PATTERN=/^[1-9][0-9]{5}$/
const PHONE_PATTERN=/^(?:\+91|91)?[6-9][0-9]{9}$/

type CheckoutBody={
  name?:string
  phone?:string
  line1?:string
  line2?:string
  city?:string
  state?:string
  postalCode?:string
}

function json(body:Record<string,unknown>,status=200){
  return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
}

function clean(value:unknown,max:number){
  return typeof value==='string'?value.trim().slice(0,max):''
}

function requestBoundaryError(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return json({error:'Cross-site checkout requests are not allowed.'},403)
  const rawLength=request.headers.get('content-length')
  if(rawLength&&Number(rawLength)>MAX_BODY_BYTES) return json({error:'Checkout request is too large.'},413)
  const origin=request.headers.get('origin')
  if(origin){
    try{
      const supplied=new URL(origin).origin
      const requestOrigin=new URL(request.url).origin
      const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin
      if(supplied!==requestOrigin&&supplied!==configured) return json({error:'Invalid checkout request origin.'},403)
    }catch{return json({error:'Invalid checkout request origin.'},403)}
  }
  return null
}

export async function POST(request:Request){
  const boundary=requestBoundaryError(request)
  if(boundary) return boundary

  const keyId=process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim()
  if(!keyId||!keySecret) return json({error:'India checkout is not yet available.'},503)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)

  let body:CheckoutBody
  try{body=await request.json()}catch{return json({error:'Invalid checkout request.'},400)}

  const name=clean(body.name,120)
  const rawPhone=clean(body.phone,20).replace(/[\s()-]/g,'')
  const phone=rawPhone.startsWith('+91')?rawPhone:`+91${rawPhone.replace(/^91/,'')}`
  const line1=clean(body.line1,180)
  const line2=clean(body.line2,180)
  const city=clean(body.city,100)
  const state=clean(body.state,100)
  const postalCode=clean(body.postalCode,6)

  if(name.length<2||!PHONE_PATTERN.test(rawPhone)||line1.length<5||city.length<2||state.length<2||!PIN_PATTERN.test(postalCode)){
    return json({error:'Please provide a valid Indian delivery name, mobile number, address, city, state and 6-digit PIN code.'},400)
  }

  const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart')
  if(orderError){
    console.error('checkout_active_cart failed',orderError)
    return json({error:'Unable to create order from the current cart.'},400)
  }
  const order=Array.isArray(orderData)?orderData[0]:orderData
  if(!order?.id) return json({error:'Unable to create order.'},400)
  if(String(order.currency||'INR').toUpperCase()!=='INR') return json({error:'RADVORA India checkout supports INR only.'},400)

  const amountPaise=Math.round(Number(order.total)*100)
  if(!Number.isSafeInteger(amountPaise)||amountPaise<=0) return json({error:'Order amount is invalid.'},400)

  const admin=createAdminClient()
  const now=new Date().toISOString()

  const {error:addressError}=await admin.from('orders').update({
    shipping_name:name,
    shipping_phone:phone,
    shipping_line1:line1,
    shipping_line2:line2||null,
    shipping_city:city,
    shipping_state:state,
    shipping_postal_code:postalCode,
    shipping_country:'IN',
    updated_at:now
  }).eq('id',order.id).eq('user_id',user.id).eq('status','pending')
  if(addressError){
    console.error('india_checkout_address_save_failed',addressError)
    return json({error:'Unable to save the delivery address.'},500)
  }

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({
    order_id:order.id,
    provider:'razorpay',
    status:'created',
    amount:order.total,
    currency:'INR'
  }).select('id').single()

  if(attemptError||!attempt){
    if(attemptError?.code==='23505') return json({error:'A payment attempt is already active for this order.',orderId:order.id,retryable:true},409)
    console.error('razorpay_attempt_create_failed',attemptError)
    return json({error:'Unable to initialize payment tracking.'},500)
  }

  try{
    const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const providerResponse=await fetch('https://api.razorpay.com/v1/orders',{
      method:'POST',
      headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        amount:amountPaise,
        currency:'INR',
        receipt:String(order.order_number).slice(0,40),
        notes:{order_id:order.id,payment_attempt_id:attempt.id}
      }),
      cache:'no-store'
    })

    const providerBody=await providerResponse.json() as {id?:string;amount?:number;currency?:string;status?:string}
    if(!providerResponse.ok||!providerBody.id||providerBody.amount!==amountPaise||String(providerBody.currency).toUpperCase()!=='INR'){
      throw new Error(`Unexpected Razorpay order response (${providerResponse.status})`)
    }

    const {error:linkError}=await admin.from('payment_attempts').update({
      provider_order_id:providerBody.id,
      status:'pending',
      updated_at:new Date().toISOString()
    }).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').eq('status','created')
    if(linkError) throw linkError

    return json({
      keyId,
      providerOrderId:providerBody.id,
      amountPaise,
      currency:'INR',
      orderId:order.id,
      orderNumber:order.order_number,
      customer:{name,email:user.email||'',phone}
    })
  }catch(error){
    console.error('razorpay_order_create_failed',error)
    await admin.from('payment_attempts').update({status:'failed',failure_code:'razorpay_order_create_failed',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').eq('status','created')
    return json({error:'Unable to start India checkout. Please try again.',orderId:order.id,retryable:true},502)
  }
}
