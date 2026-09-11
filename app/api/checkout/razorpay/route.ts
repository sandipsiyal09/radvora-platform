import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

const MAX_BODY_BYTES=8192
const PIN_PATTERN=/^[1-9][0-9]{5}$/
const PHONE_PATTERN=/^(?:\+91|91)?[6-9][0-9]{9}$/
const STALE_INITIALIZATION_MS=2*60*1000
const PAYMENT_LINK_TTL_SECONDS=30*60
const CHECKOUT_TERMS_VERSION='2026-09-11-india-v1'

type CheckoutBody={orderId?:string;acceptedPolicies?:boolean;name?:string;phone?:string;line1?:string;line2?:string;city?:string;state?:string;postalCode?:string}
type ActiveAttempt={id:string;provider_session_id:string|null;provider_session_url:string|null;provider_session_expires_at:string|null;status:string;updated_at:string}
type CheckoutOrder={id:string;order_number:string;total:number|string;currency:string;status:string;shipping_name?:string|null;shipping_phone?:string|null;shipping_line1?:string|null;shipping_line2?:string|null;shipping_city?:string|null;shipping_state?:string|null;shipping_postal_code?:string|null;shipping_country?:string|null;checkout_terms_accepted_at?:string|null;checkout_terms_version?:string|null}
type TaxItem={quantity:number;line_subtotal:number|string|null;tax_amount:number|string|null;line_total:number|string;hsn_code:string|null;gst_rate:number|string|null;price_includes_gst:boolean|null;inventory_reserved_quantity:number}
type ProviderLink={id?:string;short_url?:string;amount?:number;amount_paid?:number;currency?:string;status?:string;reference_id?:string;expire_by?:number;order_id?:string;notes?:Record<string,unknown>}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function normalizePhone(value:string){const raw=value.replace(/[\s()-]/g,'');if(!PHONE_PATTERN.test(raw))return null;return raw.startsWith('+91')?raw:`+91${raw.replace(/^91/,'')}`}
function moneyEqual(a:number,b:number){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<0.011}
function requestBoundaryError(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return json({error:'Cross-site checkout requests are not allowed.'},403)
  const rawLength=request.headers.get('content-length');if(rawLength&&Number(rawLength)>MAX_BODY_BYTES)return json({error:'Checkout request is too large.'},413)
  const origin=request.headers.get('origin')
  if(origin){try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin;if(supplied!==requestOrigin&&supplied!==configured)return json({error:'Invalid checkout request origin.'},403)}catch{return json({error:'Invalid checkout request origin.'},403)}}
  return null
}
function linkMatches(link:ProviderLink,attemptId:string,amountPaise:number){return Boolean(link.id&&link.reference_id===attemptId&&link.amount===amountPaise&&String(link.currency||'').toUpperCase()==='INR')}
function checkoutPayload(order:CheckoutOrder,attemptId:string,link:ProviderLink,reused=false){return {paymentUrl:link.short_url,providerSessionId:link.id,expiresAt:link.expire_by?new Date(link.expire_by*1000).toISOString():null,orderId:order.id,orderNumber:order.order_number,amountPaise:Math.round(Number(order.total)*100),currency:'INR',paymentAttemptId:attemptId,reused}}

export async function POST(request:Request){
  const boundary=requestBoundaryError(request);if(boundary)return boundary
  const keyId=process.env.RAZORPAY_KEY_ID?.trim();const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim()
  if(!keyId||!keySecret)return json({error:'India checkout is not yet available.'},503)
  let appOrigin=''
  try{const configured=new URL(process.env.NEXT_PUBLIC_APP_URL||'');if(configured.protocol!=='https:')throw new Error('https required');appOrigin=configured.origin}catch{return json({error:'India checkout is waiting for the final HTTPS application URL.'},503)}

  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return json({error:'Authentication required.'},401)
  let rawBody='';try{rawBody=await request.text()}catch{return json({error:'Invalid checkout request.'},400)}
  if(Buffer.byteLength(rawBody,'utf8')>MAX_BODY_BYTES)return json({error:'Checkout request is too large.'},413)
  let body:CheckoutBody;try{body=JSON.parse(rawBody)}catch{return json({error:'Invalid checkout request.'},400)}

  const admin=createAdminClient();let order:CheckoutOrder;let name='';let phone=''
  if(body.orderId){
    const {data,error}=await supabase.from('orders').select('id,order_number,total,currency,status,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,checkout_terms_accepted_at,checkout_terms_version').eq('id',body.orderId).eq('user_id',user.id).maybeSingle()
    if(error||!data)return json({error:'Order not found.'},404)
    if(data.status!=='pending')return json({error:'Only pending orders can restart payment.'},409)
    if(!data.checkout_terms_accepted_at||!data.checkout_terms_version)return json({error:'Checkout policy acceptance is required before payment.'},409)
    if(data.shipping_country!=='IN'||!data.shipping_name||!data.shipping_phone||!data.shipping_line1||!data.shipping_city||!data.shipping_state||!PIN_PATTERN.test(data.shipping_postal_code||''))return json({error:'This order does not have a complete Indian delivery address.'},409)
    const normalized=normalizePhone(data.shipping_phone);if(!normalized)return json({error:'This order does not have a valid Indian mobile number.'},409)
    name=data.shipping_name;phone=normalized;order=data as CheckoutOrder
  }else{
    if(body.acceptedPolicies!==true)return json({error:'Please accept the checkout policies before payment.'},400)
    name=clean(body.name,120);const normalized=normalizePhone(clean(body.phone,20));const line1=clean(body.line1,180);const line2=clean(body.line2,180);const city=clean(body.city,100);const state=clean(body.state,100);const postalCode=clean(body.postalCode,6)
    if(name.length<2||!normalized||line1.length<5||city.length<2||state.length<2||!PIN_PATTERN.test(postalCode))return json({error:'Please provide a valid Indian delivery name, mobile number, address, city, state and 6-digit PIN code.'},400)
    phone=normalized
    const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart_india',{p_name:name,p_phone:phone,p_line1:line1,p_line2:line2,p_city:city,p_state:state,p_postal_code:postalCode,p_terms_version:CHECKOUT_TERMS_VERSION})
    if(orderError){console.error('checkout_active_cart_india_failed',orderError);return json({error:'Unable to create the India order from the current cart.'},400)}
    const created=Array.isArray(orderData)?orderData[0]:orderData;if(!created?.order_id)return json({error:'Unable to create order.'},400)
    order={id:created.order_id,order_number:created.order_number,total:created.total,currency:created.currency,status:'pending',shipping_name:name,shipping_phone:phone,shipping_line1:line1,shipping_line2:line2||null,shipping_city:city,shipping_state:state,shipping_postal_code:postalCode,shipping_country:'IN',checkout_terms_accepted_at:created.checkout_terms_accepted_at,checkout_terms_version:CHECKOUT_TERMS_VERSION}
  }

  const [{data:storedOrder,error:storedOrderError},{data:itemRows,error:itemError}]=await Promise.all([
    admin.from('orders').select('subtotal,tax,shipping,total,currency,status').eq('id',order.id).maybeSingle(),
    admin.from('order_items').select('quantity,line_subtotal,tax_amount,line_total,hsn_code,gst_rate,price_includes_gst,inventory_reserved_quantity').eq('order_id',order.id)
  ])
  if(storedOrderError||itemError||!storedOrder||storedOrder.status!=='pending')return json({error:'Unable to verify order accounting safely.'},409)
  const items=(itemRows||[]) as TaxItem[]
  if(!items.length||items.some(item=>item.line_subtotal===null||item.tax_amount===null||!item.hsn_code||item.gst_rate===null||item.price_includes_gst===null||item.inventory_reserved_quantity!==item.quantity||item.quantity<=0))return json({error:'This order is missing required India tax or inventory reservation state and cannot be paid.'},409)
  const lineSubtotal=Math.round(items.reduce((sum,item)=>sum+Number(item.line_subtotal||0),0)*100)/100
  const lineTax=Math.round(items.reduce((sum,item)=>sum+Number(item.tax_amount||0),0)*100)/100
  const lineTotal=Math.round(items.reduce((sum,item)=>sum+Number(item.line_total||0),0)*100)/100
  const storedSubtotal=Number(storedOrder.subtotal||0);const storedTax=Number(storedOrder.tax||0);const storedShipping=Number(storedOrder.shipping||0);const storedTotal=Number(storedOrder.total||0)
  if(!moneyEqual(lineSubtotal,storedSubtotal)||!moneyEqual(lineTax,storedTax)||!moneyEqual(lineTotal+storedShipping,storedTotal)||!moneyEqual(storedSubtotal+storedTax+storedShipping,storedTotal)){console.error('india_order_accounting_mismatch',{orderId:order.id,lineSubtotal,lineTax,lineTotal,storedSubtotal,storedTax,storedShipping,storedTotal});return json({error:'Order accounting requires review before payment can continue.'},409)}
  order.total=storedOrder.total;order.currency=storedOrder.currency
  if(String(order.currency||'').toUpperCase()!=='INR')return json({error:'RADVORA India checkout supports INR only.'},400)
  const amountPaise=Math.round(Number(order.total)*100);if(!Number.isSafeInteger(amountPaise)||amountPaise<=0)return json({error:'Order amount is invalid.'},400)
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  async function fetchByReference(referenceId:string){
    const response=await fetch(`https://api.razorpay.com/v1/payment_links/?reference_id=${encodeURIComponent(referenceId)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
    if(!response.ok)throw new Error(`Payment Link lookup failed (${response.status})`)
    const body=await response.json() as {payment_links?:ProviderLink[]}
    return (body.payment_links||[]).find(link=>link.reference_id===referenceId)||null
  }
  async function bindAndEvaluate(attempt:ActiveAttempt,link:ProviderLink,reused=true){
    if(!linkMatches(link,attempt.id,amountPaise))return json({error:'Existing payment session could not be reconciled safely.'},409)
    if(link.status==='paid')return json({error:'Payment confirmation is already being processed.',orderId:order.id,retryable:false},409)
    if(link.status==='cancelled'||link.status==='expired'){
      const {error}=await admin.rpc('close_razorpay_payment_link_attempt',{p_attempt_id:attempt.id,p_session_id:link.id||'',p_reason:link.status==='cancelled'?'payment_link_cancelled':'payment_link_expired'})
      if(error){console.error('payment_link_close_reconcile_failed',error);return json({error:'Closed payment session is waiting for local reconciliation.'},503)}
      return json({error:'The previous payment session has closed and its inventory reservation was released. Please start a fresh order.',orderId:order.id,retryable:false},409)
    }
    if(link.status!=='created'||!link.short_url||!link.expire_by)return json({error:'Existing payment session is not eligible for reuse.'},409)
    if(link.expire_by*1000<=Date.now())return json({error:'Payment session expiry is being reconciled. Please refresh shortly.'},409)
    const {error:bindError}=await admin.from('payment_attempts').update({provider_session_id:link.id,provider_session_url:link.short_url,provider_session_expires_at:new Date(link.expire_by*1000).toISOString(),status:'pending',failure_code:null,updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').in('status',['created','pending'])
    if(bindError)return json({error:'Unable to persist payment session safely.'},500)
    return json(checkoutPayload(order,attempt.id,link,reused))
  }

  const {data:existing,error:existingError}=await admin.from('payment_attempts').select('id,provider_session_id,provider_session_url,provider_session_expires_at,status,updated_at').eq('order_id',order.id).eq('provider','razorpay').in('status',['created','pending']).order('created_at',{ascending:false}).limit(1).maybeSingle<ActiveAttempt>()
  if(existingError)return json({error:'Unable to verify payment state safely.'},500)
  if(existing){
    try{
      let link:ProviderLink|null=null
      if(existing.provider_session_id){
        const response=await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(existing.provider_session_id)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
        if(!response.ok)throw new Error(`Payment Link fetch failed (${response.status})`)
        link=await response.json() as ProviderLink
      }else{
        link=await fetchByReference(existing.id)
        if(!link){const age=Date.now()-Date.parse(existing.updated_at);if(Number.isFinite(age)&&age<STALE_INITIALIZATION_MS)return json({error:'Payment is already being initialized. Please try again shortly.',orderId:order.id,retryable:true},409);const {error:retire}=await admin.from('payment_attempts').update({status:'failed',failure_code:'provider_session_not_found',updated_at:new Date().toISOString()}).eq('id',existing.id).eq('status','created');if(retire)return json({error:'Unable to refresh payment state safely.'},500)}
      }
      if(link)return await bindAndEvaluate(existing,link,true)
    }catch(error){console.error('payment_link_existing_reconcile_failed',error);return json({error:'Unable to verify the existing payment session. Please try again shortly.',orderId:order.id,retryable:true},502)}
  }

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({order_id:order.id,provider:'razorpay',status:'created',amount:order.total,currency:'INR'}).select('id,updated_at').single()
  if(attemptError||!attempt){if(attemptError?.code==='23505')return json({error:'A payment attempt is already active for this order.',orderId:order.id,retryable:true},409);console.error('payment_attempt_create_failed',attemptError);return json({error:'Unable to initialize payment tracking.'},500)}

  const expireBy=Math.floor(Date.now()/1000)+PAYMENT_LINK_TTL_SECONDS
  const customer:Record<string,string>={name,contact:phone};if(user.email)customer.email=user.email
  const callbackUrl=`${appOrigin}/checkout/success?order_id=${encodeURIComponent(order.id)}`
  try{
    const providerResponse=await fetch('https://api.razorpay.com/v1/payment_links',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount:amountPaise,currency:'INR',accept_partial:false,expire_by:expireBy,reference_id:attempt.id,description:`RADVORA order ${order.order_number}`,customer,notify:{sms:false,email:false},reminder_enable:false,callback_url:callbackUrl,callback_method:'get',notes:{radvora_order_id:order.id,payment_attempt_id:attempt.id}}),cache:'no-store'})
    const providerBody=await providerResponse.json() as ProviderLink
    if(!providerResponse.ok){
      if(providerResponse.status<500)await admin.from('payment_attempts').update({status:'failed',failure_code:'payment_link_rejected',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('status','created')
      else await admin.from('payment_attempts').update({failure_code:'payment_link_create_uncertain',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('status','created')
      return json({error:'Unable to start the secure payment session. Please retry this same order; the server will reconcile by reference before creating anything new.',orderId:order.id,retryable:true},providerResponse.status>=500?502:409)
    }
    if(!linkMatches(providerBody,attempt.id,amountPaise)||providerBody.status!=='created'||!providerBody.short_url||!providerBody.expire_by)throw new Error('Unexpected Payment Link response')
    const {error:linkError}=await admin.from('payment_attempts').update({provider_session_id:providerBody.id,provider_session_url:providerBody.short_url,provider_session_expires_at:new Date(providerBody.expire_by*1000).toISOString(),status:'pending',failure_code:null,updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('order_id',order.id).eq('provider','razorpay').eq('status','created')
    if(linkError)throw linkError
    return json(checkoutPayload(order,attempt.id,providerBody,false))
  }catch(error){
    console.error('payment_link_create_uncertain',error)
    await admin.from('payment_attempts').update({failure_code:'payment_link_create_uncertain',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('status','created')
    return json({error:'Payment session creation is uncertain. Please retry this same order; RADVORA will search Razorpay by the unique reference before creating another session.',orderId:order.id,retryable:true},502)
  }
}
