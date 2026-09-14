import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'

export const runtime='nodejs'
export const maxDuration=10
const MAX_BODY_BYTES=2048
const PROVIDER_DEADLINE_MS=8000
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const RESPONSE_HEADERS={
  'Cache-Control':'no-store',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const

type Body={reason?:string}
type Params={params:Promise<{id:string}>}
type ProviderRefund={id?:string;payment_id?:string;amount?:number;currency?:string;status?:string;notes?:Record<string,unknown>}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:RESPONSE_HEADERS})}
function isProductionRuntime(){return process.env.VERCEL_ENV==='production'||(process.env.NODE_ENV==='production'&&!process.env.VERCEL_ENV)}
function isSafeProductionOrigin(url:URL){
  const hostname=url.hostname.toLowerCase()
  const isIpLiteral=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)||hostname.includes(':')
  return url.protocol==='https:'&&!url.username&&!url.password&&!isIpLiteral&&hostname!=='localhost'&&!hostname.endsWith('.')&&hostname.includes('.')&&(url.pathname==='/'||url.pathname==='')&&!url.search&&!url.hash&&(url.port===''||url.port==='443')
}
function canonicalOrigin(request:Request){
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim()
  if(configured){
    try{
      const url=new URL(configured)
      if(isProductionRuntime())return isSafeProductionOrigin(url)?url.origin:null
      if(url.protocol==='https:'||url.hostname==='localhost')return url.origin
    }catch{
      // Production refund operations must fail closed instead of trusting request.url.
    }
  }
  if(isProductionRuntime())return null
  try{
    const url=new URL(request.url)
    return url.protocol==='https:'||url.hostname==='localhost'?url.origin:null
  }catch{return null}
}

function boundary(request:Request,canonical:string){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return json({error:'Cross-site refund requests are not allowed.'},403)
  const rawLength=request.headers.get('content-length')
  if(rawLength){
    const declaredLength=Number(rawLength)
    if(!Number.isSafeInteger(declaredLength)||declaredLength<0) return json({error:'Invalid refund request length.'},400)
    if(declaredLength>MAX_BODY_BYTES) return json({error:'Refund request is too large.'},413)
  }
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'Unsupported refund media type.'},415)
  const origin=request.headers.get('origin')
  if(!origin) return json({error:'Invalid refund request origin.'},403)
  try{
    const supplied=new URL(origin).origin
    if(isProductionRuntime())return supplied===canonical?null:json({error:'Invalid refund request origin.'},403)
    const requestOrigin=new URL(request.url).origin
    if(supplied!==requestOrigin&&supplied!==canonical) return json({error:'Invalid refund request origin.'},403)
  }catch{return json({error:'Invalid refund request origin.'},403)}
  return null
}

function validateProviderRefund(refund:ProviderRefund,paymentId:string,amountPaise:number,attemptId:string){
  const notes=refund.notes||{}
  return Boolean(
    refund.id&&
    refund.payment_id===paymentId&&
    refund.amount===amountPaise&&
    String(refund.currency||'').toUpperCase()==='INR'&&
    ['pending','processed'].includes(String(refund.status||''))&&
    String(notes.refund_attempt_id||'')===attemptId
  )
}

export async function POST(request:Request,{params}:Params){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin) return json({error:'Refund operations are temporarily unavailable.'},503)
  const requestError=boundary(request,expectedOrigin)
  if(requestError) return requestError

  const keyId=process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim()
  if(!keyId||!keySecret) return json({error:'India payment operations are not configured.'},503)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder') return json({error:'Admin access required.'},403)

  const {id:orderId}=await params
  if(!UUID_PATTERN.test(orderId)) return json({error:'Order not found.'},404)

  let rawBytes:ArrayBuffer
  try{rawBytes=await request.arrayBuffer()}catch{return json({error:'Unable to read refund request.'},400)}
  if(rawBytes.byteLength>MAX_BODY_BYTES) return json({error:'Refund request is too large.'},413)
  let parsed:unknown
  try{parsed=JSON.parse(Buffer.from(rawBytes).toString('utf8'))}catch{return json({error:'Invalid refund request.'},400)}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) return json({error:'Invalid refund request.'},400)
  const body=parsed as Body
  const reason=typeof body.reason==='string'?body.reason.trim().slice(0,500):''
  if(reason.length<5) return json({error:'Enter a refund reason of at least 5 characters.'},400)

  const admin=createAdminClient()
  const {data:order,error:orderError}=await admin.from('orders').select('id,status,total,currency,order_number').eq('id',orderId).maybeSingle()
  if(orderError||!order) return json({error:'Order not found.'},404)
  if(!['paid','processing'].includes(order.status)) return json({error:'Only paid or processing orders that have not shipped can be refunded here.'},409)
  if(order.currency!=='INR'||Number(order.total)<=0) return json({error:'Order is not eligible for India payment refund.'},409)

  const {data:payment,error:paymentError}=await admin.from('payment_attempts')
    .select('id,provider,provider_payment_id,amount,currency,status')
    .eq('order_id',orderId).eq('provider','razorpay').eq('status','captured')
    .order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(paymentError||!payment||!payment.provider_payment_id) return json({error:'Captured Razorpay payment not found.'},409)
  if(Number(payment.amount)!==Number(order.total)||payment.currency!=='INR') return json({error:'Payment and order totals do not reconcile.'},409)

  const {data:existing,error:existingError}=await admin.from('refund_attempts')
    .select('id,status,provider_refund_id,amount,currency,reason,submission_started_at')
    .eq('order_id',orderId).in('status',['requested','submitting','pending']).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(existingError) return json({error:'Unable to verify refund state safely.'},500)
  if(existing?.status==='pending') return json({ok:true,orderId,refundAttemptId:existing.id,status:'pending',alreadyRequested:true})

  let refundAttempt=existing
  if(!refundAttempt){
    const {data,error}=await admin.from('refund_attempts').insert({
      order_id:orderId,payment_attempt_id:payment.id,provider:'razorpay',amount:order.total,currency:'INR',status:'requested',reason,requested_by:user.id
    }).select('id,status,provider_refund_id,amount,currency,reason,submission_started_at').single()
    if(error||!data){
      if(error?.code==='23505') return json({error:'A refund is already being processed for this order.'},409)
      console.error('refund_attempt_create_failed')
      return json({error:'Unable to initialize the refund safely.'},500)
    }
    refundAttempt=data
  }

  const amountPaise=Math.round(Number(order.total)*100)
  if(!Number.isSafeInteger(amountPaise)||amountPaise<=0) return json({error:'Refund amount is invalid.'},409)
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const providerAbort=new AbortController()
  const providerTimeout=setTimeout(()=>providerAbort.abort(),PROVIDER_DEADLINE_MS)

  try{
    const listResponse=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.provider_payment_id)}/refunds?count=100`,{
      headers:{Authorization:`Basic ${auth}`},cache:'no-store',signal:providerAbort.signal
    })
    if(listResponse.ok){
      const listBody=await listResponse.json() as {items?:ProviderRefund[]}
      const matched=(listBody.items||[]).find(item=>String(item.notes?.refund_attempt_id||'')===refundAttempt.id)
      if(matched){
        if(!validateProviderRefund(matched,payment.provider_payment_id,amountPaise,refundAttempt.id)){
          console.error('razorpay_existing_refund_mismatch',{orderId,refundAttemptId:refundAttempt.id,providerRefundId:matched.id})
          return json({error:'Existing provider refund could not be reconciled safely. Review the provider dashboard before taking action.'},409)
        }
        const providerStatus=String(matched.status)
        const {error:reconcileError}=await admin.rpc('finalize_razorpay_refund',{
          p_refund_attempt_id:refundAttempt.id,p_provider_refund_id:matched.id||'',p_status:providerStatus,p_failure_code:null
        })
        if(reconcileError){
          console.error('razorpay_existing_refund_reconcile_failed')
          return json({error:'An existing provider refund was found but local reconciliation is pending. Do not issue another refund.'},502)
        }
        return json({ok:true,orderId,refundAttemptId:refundAttempt.id,status:providerStatus,reconciled:true})
      }
    }else if(refundAttempt.status==='submitting'){
      return json({error:'Unable to verify an in-flight provider refund safely. Try again later; no second refund was submitted.'},503)
    }

    const {data:claimed,error:claimError}=await admin.rpc('claim_razorpay_refund_submission',{p_refund_attempt_id:refundAttempt.id})
    if(claimError){
      console.error('razorpay_refund_claim_failed')
      return json({error:'Unable to claim the refund request safely.'},500)
    }
    if(claimed!==true) return json({error:'This refund is already being submitted or processed. No second refund was sent.'},409)

    const providerResponse=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.provider_payment_id)}/refund`,{
      method:'POST',
      headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},
      body:JSON.stringify({amount:amountPaise,notes:{radvora_order_id:orderId,refund_attempt_id:refundAttempt.id,reason:refundAttempt.reason}}),
      cache:'no-store',signal:providerAbort.signal
    })
    const providerBody=await providerResponse.json() as ProviderRefund

    if(!providerResponse.ok){
      console.error('razorpay_refund_request_rejected',{status:providerResponse.status,orderId,refundAttemptId:refundAttempt.id})
      if(providerResponse.status<500){
        await admin.rpc('finalize_razorpay_refund',{p_refund_attempt_id:refundAttempt.id,p_provider_refund_id:providerBody.id||'',p_status:'failed',p_failure_code:'provider_rejected_refund'})
      }
      return json({error:'Razorpay did not accept the refund request. Review the payment/refund state before retrying.',retryable:providerResponse.status>=500},providerResponse.status>=500?502:409)
    }

    if(!validateProviderRefund(providerBody,payment.provider_payment_id,amountPaise,refundAttempt.id)){
      console.error('razorpay_refund_response_mismatch',{orderId,refundAttemptId:refundAttempt.id,providerStatus:providerBody.status})
      return json({error:'Refund response could not be reconciled safely. Do not submit a second refund; review the provider dashboard.'},502)
    }

    const providerStatus=String(providerBody.status)
    const {error:finalizeError}=await admin.rpc('finalize_razorpay_refund',{
      p_refund_attempt_id:refundAttempt.id,
      p_provider_refund_id:providerBody.id||'',
      p_status:providerStatus,
      p_failure_code:null
    })
    if(finalizeError){
      console.error('razorpay_refund_record_failed')
      return json({error:'Refund was accepted by the provider but local reconciliation is pending. Do not issue another refund.'},502)
    }

    return json({ok:true,orderId,refundAttemptId:refundAttempt.id,status:providerStatus})
  }catch{
    console.error('razorpay_refund_request_failed')
    return json({error:'Refund status is uncertain because the provider could not be reached. Retry this same order later; the server will reconcile provider state before sending another request.'},502)
  }finally{
    clearTimeout(providerTimeout)
  }
}
