import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'

const MAX_BODY_BYTES=4096

type VerifyBody={
  orderId?:string
  razorpayOrderId?:string
  razorpayPaymentId?:string
  razorpaySignature?:string
}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function safeEqualHex(expected:string,received:string){
  try{
    const a=Buffer.from(expected,'hex')
    const b=Buffer.from(received,'hex')
    return a.length===b.length&&a.length>0&&timingSafeEqual(a,b)
  }catch{return false}
}

export async function POST(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return json({error:'Cross-site payment verification is not allowed.'},403)
  const rawLength=request.headers.get('content-length')
  if(rawLength&&Number(rawLength)>MAX_BODY_BYTES) return json({error:'Verification request is too large.'},413)

  const keyId=process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim()
  if(!keyId||!keySecret) return json({error:'India checkout is not yet available.'},503)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)

  let body:VerifyBody
  try{body=await request.json()}catch{return json({error:'Invalid verification request.'},400)}
  const orderId=typeof body.orderId==='string'?body.orderId.trim():''
  const returnedOrderId=typeof body.razorpayOrderId==='string'?body.razorpayOrderId.trim():''
  const paymentId=typeof body.razorpayPaymentId==='string'?body.razorpayPaymentId.trim():''
  const signature=typeof body.razorpaySignature==='string'?body.razorpaySignature.trim():''
  if(!orderId||!returnedOrderId||!paymentId||!/^[a-f0-9]{64}$/i.test(signature)) return json({error:'Payment verification data is incomplete.'},400)

  const {data:ownedOrder,error:ownedOrderError}=await supabase.from('orders').select('id,total,currency,status').eq('id',orderId).eq('user_id',user.id).maybeSingle()
  if(ownedOrderError||!ownedOrder) return json({error:'Order not found.'},404)
  if(ownedOrder.status!=='pending') return json({ok:true,orderId,status:ownedOrder.status,alreadyProcessed:true})

  const admin=createAdminClient()
  const {data:attempt,error:attemptError}=await admin.from('payment_attempts')
    .select('id,provider_order_id,amount,currency,status')
    .eq('order_id',orderId).eq('provider','razorpay').eq('provider_order_id',returnedOrderId)
    .in('status',['created','pending']).maybeSingle()
  if(attemptError||!attempt) return json({error:'Active payment attempt not found.'},409)

  const storedProviderOrderId=String(attempt.provider_order_id||'')
  const expected=createHmac('sha256',keySecret).update(`${storedProviderOrderId}|${paymentId}`).digest('hex')
  if(!safeEqualHex(expected,signature)){
    await admin.from('payment_attempts').update({status:'failed',failure_code:'invalid_payment_signature',updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('status','pending')
    return json({error:'Payment verification failed.'},400)
  }

  try{
    const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const providerResponse=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{
      headers:{Authorization:`Basic ${auth}`},cache:'no-store'
    })
    const payment=await providerResponse.json() as {id?:string;order_id?:string;amount?:number;currency?:string;status?:string}
    const expectedPaise=Math.round(Number(attempt.amount)*100)
    const valid=providerResponse.ok&&payment.id===paymentId&&payment.order_id===storedProviderOrderId&&payment.amount===expectedPaise&&String(payment.currency).toUpperCase()==='INR'&&payment.status==='captured'
    if(!valid) return json({error:'Payment is not yet confirmed as captured.',orderId,retryable:true},409)

    const now=new Date().toISOString()
    const {error:attemptUpdateError}=await admin.from('payment_attempts').update({
      provider_payment_id:paymentId,status:'captured',failure_code:null,updated_at:now
    }).eq('id',attempt.id).eq('order_id',orderId).eq('provider','razorpay').eq('status','pending')
    if(attemptUpdateError) throw attemptUpdateError

    const {error:orderUpdateError}=await admin.from('orders').update({
      status:'paid',payment_provider:'razorpay',payment_reference:paymentId,updated_at:now
    }).eq('id',orderId).eq('user_id',user.id).eq('status','pending').eq('currency','INR')
    if(orderUpdateError) throw orderUpdateError

    return json({ok:true,orderId,status:'paid'})
  }catch(error){
    console.error('razorpay_payment_verification_failed',error)
    return json({error:'Unable to confirm payment status safely. Please check your order shortly.',orderId,retryable:true},502)
  }
}
