import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Params={params:Promise<{id:string}>}
type PaymentLink={id?:string;status?:string;amount?:number;amount_paid?:number;currency?:string;reference_id?:string}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function canonicalOrigin(request:Request){
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim()
  if(configured){
    try{const url=new URL(configured);if(url.protocol==='https:'||url.hostname==='localhost')return url.origin}catch{
      // Production cancellation mutations fail closed below instead of trusting request.url.
    }
  }
  if(process.env.VERCEL_ENV==='production')return null
  if(process.env.NODE_ENV==='production'&&!process.env.VERCEL_ENV)return null
  try{const url=new URL(request.url);return url.protocol==='https:'||url.hostname==='localhost'?url.origin:null}catch{return null}
}
function invalidOrigin(request:Request,canonical:string){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin');if(!origin)return true
  try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;return supplied!==requestOrigin&&supplied!==canonical}catch{return true}
}

export async function POST(request:Request,{params}:Params){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin)return json({error:'Order cancellation is temporarily unavailable.'},503)
  if(invalidOrigin(request,expectedOrigin))return json({error:'Invalid cancellation request origin.'},403)
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return json({error:'Authentication required.'},401)
  const {id:orderId}=await params;if(!UUID_PATTERN.test(orderId))return json({error:'Order not found.'},404)
  const admin=createAdminClient()

  const {data:order,error:orderError}=await admin.from('orders').select('id,user_id,status').eq('id',orderId).maybeSingle()
  if(orderError||!order||order.user_id!==user.id)return json({error:'Order not found.'},404)
  if(order.status!=='pending')return json({error:'Only pending unpaid orders can be cancelled.'},409)

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').select('id,provider,provider_session_id,provider_order_id,provider_payment_id,amount,currency,status').eq('order_id',orderId).eq('provider','razorpay').order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(attemptError)return json({error:'Unable to verify payment state safely.'},500)

  if(attempt?.provider_session_id){
    const keyId=process.env.RAZORPAY_KEY_ID?.trim();const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim()
    if(!keyId||!keySecret)return json({error:'Payment-provider reconciliation is unavailable. The order cannot be cancelled safely right now.'},503)
    const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    try{
      const fetchResponse=await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(attempt.provider_session_id)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
      if(!fetchResponse.ok)throw new Error(`Payment Link fetch failed (${fetchResponse.status})`)
      let link=await fetchResponse.json() as PaymentLink
      const expectedPaise=Math.round(Number(attempt.amount)*100)
      if(link.id!==attempt.provider_session_id||link.reference_id!==attempt.id||link.amount!==expectedPaise||String(link.currency||'').toUpperCase()!=='INR')return json({error:'Payment-provider session could not be reconciled safely.'},409)
      if(link.status==='paid'||Number(link.amount_paid||0)>0)return json({error:'Payment has progressed at the provider. Cancellation is blocked while payment confirmation/refund handling completes.'},409)
      if(link.status==='created'){
        const cancelResponse=await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(attempt.provider_session_id)}/cancel`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},cache:'no-store'})
        if(!cancelResponse.ok)return json({error:'The payment provider did not confirm session cancellation. Inventory remains reserved for safety.'},502)
        link=await cancelResponse.json() as PaymentLink
      }
      if(!['cancelled','expired'].includes(String(link.status))||Number(link.amount_paid||0)!==0)return json({error:'The payment session is not safely closed yet. Inventory remains reserved.'},409)
      const {data:closed,error:closeError}=await admin.rpc('close_razorpay_payment_link_attempt',{p_attempt_id:attempt.id,p_session_id:attempt.provider_session_id,p_reason:link.status==='cancelled'?'payment_link_cancelled':'payment_link_expired'})
      if(closeError){console.error('payment_link_cancel_reconcile_failed',closeError);return json({error:'The provider session is closed, but local cancellation reconciliation is pending. Do not retry payment; contact Support.'},502)}
      return json({ok:true,orderId:closed?.id||orderId,status:'cancelled'})
    }catch(error){console.error('payment_link_cancel_failed',error);return json({error:'Unable to verify or cancel the provider payment session. Inventory remains reserved for safety.'},502)}
  }

  if(attempt&&(attempt.provider_order_id||attempt.provider_payment_id||['created','pending','authorized','captured','refunded'].includes(attempt.status)))return json({error:'This order has unresolved payment-provider state. Inventory cannot be released until reconciliation completes.'},409)

  const {data,error}=await admin.rpc('cancel_pending_order',{p_order_id:orderId,p_user_id:user.id})
  if(error){
    const message=String(error.message||'')
    if(message.includes('not found'))return json({error:'Order not found.'},404)
    if(message.includes('not pending'))return json({error:'Only pending unpaid orders can be cancelled.'},409)
    if(message.includes('provider payment state')||message.includes('active or completed payment state'))return json({error:'This order already has payment-provider state. Inventory cannot be released until reconciliation completes.'},409)
    console.error('pending_order_cancel_failed',error);return json({error:'Unable to cancel the order safely.'},500)
  }
  return json({ok:true,orderId:data?.id||orderId,status:'cancelled'})
}