import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

const MAX_BODY_BYTES=8192
const PIN_PATTERN=/^[1-9][0-9]{5}$/
const PHONE_PATTERN=/^(?:\+91|91)?[6-9][0-9]{9}$/
const STALE_INITIALIZATION_MS=2*60*1000
const CHECKOUT_TERMS_VERSION='2026-09-11-india-v1'

type CheckoutBody={
  orderId?:string
  acceptedPolicies?:boolean
  name?:string
  phone?:string
  line1?:string
  line2?:string
  city?:string
  state?:string
  postalCode?:string
}
type ActiveAttempt={id:string;provider_order_id:string|null;status:string;updated_at:string}

type CheckoutOrder={
  id:string
  order_number:string
  total:number|string
  currency:string
  status:string
  shipping_name?:string|null
  shipping_phone?:string|null
  shipping_line1?:string|null
  shipping_line2?:string|null
  shipping_city?:string|null
  shipping_state?:string|null
  shipping_postal_code?:string|null
  shipping_country?:string|null
  checkout_terms_accepted_at?:string|null
  checkout_terms_version?:string|null
}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function normalizePhone(value:string){
  const raw=value.replace(/[\s()-]/g,'')
  if(!PHONE_PATTERN.test(raw)) return null
  return raw.startsWith('+91')?raw:`+91${raw.replace(/^91/,'')}`
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

function checkoutPayload(keyId:string,order:CheckoutOrder,providerOrderId:string,amountPaise:number,email:string,name:string,phone:string,reused=false){
  return {keyId,providerOrderId,amountPaise,currency:'INR',orderId:order.id,orderNumber:order.order_number,customer:{name,email,phone},reused}
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

  let rawBody:string
  try{rawBody=await request.text()}catch{return json({error:'Invalid checkout request.'},400)}
  if(Buffer.byteLength(rawBody,'utf8')>MAX_BODY_BYTES) return json({error:'Checkout request is too large.'},413)

  let body:CheckoutBody
  try{body=JSON.parse(rawBody)}catch{return json({error:'Invalid checkout request.'},400)}

  const admin=createAdminClient()
  let order:CheckoutOrder
  let name=''
  let phone=''

  if(body.orderId){
    const {data,error}=await supabase.from('orders')
      .select('id,order_number,total,currency,status,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,checkout_terms_accepted_at,checkout_terms_version')
      .eq('id',body.orderId).eq('user_id',user.id).maybeSingle()
    if(error||!data) return json({error:'Order not found.'},404)
    if(data.status!=='pending') return json({error:'Only pending orders can restart payment.'},409)
    if(!data.checkout_terms_accepted_at||!data.checkout_terms_version) return json({error:'Checkout policy acceptance is required before payment.'},409)
    if(data.shipping_country!=='IN'||!data.shipping_name||!data.shipping_phone||!data.shipping_line1||!data.shipping_city||!data.shipping_state||!PIN_PATTERN.test(data.shipping_postal_code||'')){
      return json({error:'This order does not have a complete Indian delivery address.'},409)
    }
    const normalized=normalizePhone(data.shipping_phone)
    if(!normalized) return json({error:'This order does not have a valid Indian mobile number.'},409)
    name=data.shipping_name
    phone=normalized
    order=data as CheckoutOrder
  }else{
    if(body.acceptedPolicies!==true) return json({error:'Please accept the checkout policies before payment.'},400)
    name=clean(body.name,120)
    const normalized=normalizePhone(clean(body.phone,20))
    const line1=clean(body.line1,180)
    const line2=clean(body.line2,180)
    const city=clean(body.city,100)
    const state=clean(body.state,100)
    const postalCode=clean(body.postalCode,6)
    if(name.length<2||!normalized||line1.length<5||city.length<2||state.length<2||!PIN_PATTERN.test(postalCode)){
      return json({error:'Please provide a valid Indian delivery name, mobile number, address, city, state and 6-digit PIN code.'},400)
    }
    phone=normalized

    const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart_india',{
      p_name:name,
      p_phone:phone,
      p_line1:line1,
      p_line2:line2,
      p_city:city,
      p_state:state,
      p_postal_code:postalCode,
      p_terms_version:CHECKOUT_TERMS_VERSION
    })
    if(orderError){
      console.error('checkout_active_cart_india failed',orderError)
      return json({error:'Unable to create the India order from the current cart.'},400)
    }
    const created=Array.isArray(orderData)?orderData[0]:orderData
    if(!created?.order_id) return json({error:'Unable to create order.'},400)
    order={
      id:created.order_id,
      order_number:created.order_number,
      total:created.total,
      currency:created.currency,
      status:'pending',
      shipping_name:name,
      shipping_phone:phone,
      shipping_line1:line1,
      shipping_line2:line2||null,
      shipping_city:city,
      shipping_state:state,
      shipping_postal_code:postalCode,
      shipping_country:'IN',
      checkout_terms_accepted_at:created.checkout_terms_accepted_at,
      checkout_terms_version:CHECKOUT_TERMS_VERSION
    }
  }

  if(String(order.currency||'INR').toUpperCase()!=='INR') return json({error:'RADVORA India checkout supports INR only.'},400)
  const amountPaise=Math.round(Number(order.total)*100)
  if(!Number.isSafeInteger(amountPaise)||amountPaise<=0) return json({error:'Order amount is invalid.'},400)
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const {data:existing,error:existingError}=await admin.from('payment_attempts')
    .select('id,provider_order_id,status,updated_at').eq('order_id',order.id).in('status',['created','pending'])
    .order('created_at',{ascending:false}).limit(1).maybeSingle<ActiveAttempt>()
  if(existingError){
    console.error('razorpay_active_attempt_lookup_failed',existingError)
    return json({error:'Unable to verify payment state safely.'},500)
  }

  if(existing){
    if(existing.provider_order_id){
      try{
        const response=await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(existing.provider_order_id)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
        const providerOrder=await response.json() as {id?:string;amount?:number;currency?:string;status?:string}
        if(response.ok&&providerOrder.id===existing.provider_order_id&&providerOrder.amount===amountPaise&&String(providerOrder.currency).toUpperCase()==='INR'&&['created','attempted'].includes(String(providerOrder.status))){
          return json(checkoutPayload(keyId,order,existing.provider_order_id,amountPaise,user.email||'',name,phone,true))
        }
        if(response.ok&&providerOrder.status==='paid') return json({error:'Payment confirmation is already being processed.',orderId:order.id,retryable:false},409)
        const {error:retireError}=await admin.from('payment_attempts').update({status:'failed',failure_code:`razorpay_order_${providerOrder.status||'inactive'}`,updated_at:new Date().toISOString()}).eq('id',existing.id).in('status',['created','pending'])
        if(retireError) throw retireError
      }catch(error){
        console.error('razorpay_existing_order_lookup_failed',error)
        return json({error:'Unable to verify the existing payment session. Please try again shortly.',orderId:order.id,retryable:true},502)
      }
    }else{
      const age=Date.now()-Date.parse(existing.updated_at)
      if(Number.isFinite(age)&&age<STALE_INITIALIZATION_MS) return json({error:'Payment is already being initialized. Please try again shortly.',orderId:order.id,retryable:true},409)
      const {error:retireError}=await admin.from('payment_attempts').update({status:'failed',failure_code:'stale_payment_initialization',updated_at:new Date().toISOString()}).eq('id',existing.id).eq('status','created')
      if(retireError) return json({error:'Unable to refresh payment state safely.'},500)
    }
  }

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({order_id:order.id,provider:'razorpay',status:'created',amount:order.total,currency:'INR'}).select('id').single()
  if(attemptError||!attempt){
    if(attemptError?.code==='23505') return json({error:'A payment attempt is already active for this order.',orderId:order.id,retryable:true},409)
    console.error('razorpay_attempt_create_failed',attemptError)
    return json({error:'Unable to initialize payment tracking.'},500)
  }

  try{
    const providerResponse=await fetch('https://api.razorpay.com/v1/orders',{
      method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},
      body:JSON.stringify({amount:amountPaise,currency:'INR',receipt:String(order.order_number).slice(0,40),notes:{order_id:order.id,payment_attempt_id:attempt.id}}),cache:'no-store'
    })
    const providerBody=await providerResponse.json() as {id?:string;amount?:number;currency?:string}
    if(!providerResponse.ok||!providerBody.id||providerBody.amount!==amountPaise||String(providerBody.currency).toUpperCase()!=='INR') throw new Error(`Unexpected Razorpay order response (${providerResponse.status})`)

    const {error:linkError}=await admin.from('payment_attempts').update({provider_order_id:providerBody.id,status:'pending',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').eq('status','created')
    if(linkError) throw linkError

    return json(checkoutPayload(keyId,order,providerBody.id,amountPaise,user.email||'',name,phone))
  }catch(error){
    console.error('razorpay_order_create_failed',error)
    await admin.from('payment_attempts').update({status:'failed',failure_code:'razorpay_order_create_failed',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').eq('status','created')
    return json({error:'Unable to start India checkout. Please try again.',orderId:order.id,retryable:true},502)
  }
}
