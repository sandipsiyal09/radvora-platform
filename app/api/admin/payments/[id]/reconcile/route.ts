import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../../lib/supabase/admin'

export const runtime='nodejs'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Params={params:Promise<{id:string}>}
type Link={id?:string;status?:string;amount?:number;amount_paid?:number;currency?:string;reference_id?:string;expire_by?:number;order_id?:string;short_url?:string;notes?:Record<string,unknown>}
type Payment={id?:string;order_id?:string;amount?:number;currency?:string;status?:string}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin');if(!origin)return false
  try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin;return supplied!==requestOrigin&&supplied!==configured}catch{return true}
}

export async function POST(request:Request,{params}:Params){
  if(invalidOrigin(request))return json({error:'Invalid payment reconciliation origin.'},403)
  const {id:attemptId}=await params;if(!UUID.test(attemptId))return json({error:'Payment attempt not found.'},404)
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'');if(role!=='admin'&&role!=='founder')return json({error:'Admin access required.'},403)
  const keyId=process.env.RAZORPAY_KEY_ID?.trim();const keySecret=process.env.RAZORPAY_KEY_SECRET?.trim();if(!keyId||!keySecret)return json({error:'Razorpay reconciliation is not configured.'},503)
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const admin=createAdminClient()

  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').select('id,order_id,provider,provider_session_id,provider_order_id,provider_payment_id,amount,currency,status').eq('id',attemptId).eq('provider','razorpay').maybeSingle()
  if(attemptError||!attempt)return json({error:'Payment attempt not found.'},404)
  const expectedPaise=Math.round(Number(attempt.amount)*100);if(!Number.isSafeInteger(expectedPaise)||expectedPaise<=0||attempt.currency!=='INR')return json({error:'Payment attempt amount is invalid.'},409)

  try{
    let link:Link|null=null
    if(attempt.provider_session_id){
      const response=await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(attempt.provider_session_id)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
      if(!response.ok)throw new Error(`Payment Link fetch failed (${response.status})`)
      link=await response.json() as Link
    }else{
      const response=await fetch(`https://api.razorpay.com/v1/payment_links/?reference_id=${encodeURIComponent(attempt.id)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
      if(!response.ok)throw new Error(`Payment Link reference lookup failed (${response.status})`)
      const body=await response.json() as {payment_links?:Link[]};link=(body.payment_links||[]).find(item=>item.reference_id===attempt.id)||null
      if(!link)return json({ok:true,status:'not_found',detail:'No Razorpay Payment Link exists for this attempt reference. No payment or inventory state was changed.'})
    }

    if(!link.id||link.reference_id!==attempt.id||link.amount!==expectedPaise||String(link.currency||'').toUpperCase()!=='INR')return json({error:'Provider Payment Link does not reconcile with this attempt.'},409)
    const noteAttempt=String(link.notes?.payment_attempt_id||'');const noteOrder=String(link.notes?.radvora_order_id||'')
    if(noteAttempt&&noteAttempt!==attempt.id||noteOrder&&noteOrder!==attempt.order_id)return json({error:'Provider Payment Link notes do not match the internal ledger.'},409)

    if(!attempt.provider_session_id){
      const {error:bindError}=await admin.from('payment_attempts').update({provider_session_id:link.id,provider_session_url:link.short_url||null,provider_session_expires_at:link.expire_by?new Date(link.expire_by*1000).toISOString():null,updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('provider','razorpay')
      if(bindError)throw bindError
    }

    if(link.status==='created')return json({ok:true,status:'active',expiresAt:link.expire_by?new Date(link.expire_by*1000).toISOString():null,detail:'Provider session is still active. Inventory remains reserved.'})
    if(link.status==='partially_paid')return json({error:'Unexpected partial-payment state requires provider review. Inventory and order state were not changed.'},409)
    if(link.status==='cancelled'||link.status==='expired'){
      if(Number(link.amount_paid||0)!==0)return json({error:'Closed Payment Link reports a paid amount; manual review is required.'},409)
      const {error:closeError}=await admin.rpc('close_razorpay_payment_link_attempt',{p_attempt_id:attempt.id,p_session_id:link.id,p_reason:link.status==='cancelled'?'payment_link_cancelled':'payment_link_expired'})
      if(closeError)throw closeError
      return json({ok:true,status:link.status,detail:'Provider-confirmed closed session reconciled; unpaid inventory reservation released.'})
    }
    if(link.status==='paid'){
      if(link.amount_paid!==expectedPaise||!link.order_id)return json({error:'Paid Payment Link amount or provider order is invalid.'},409)
      const paymentsResponse=await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(link.order_id)}/payments`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})
      if(!paymentsResponse.ok)throw new Error(`Provider payments fetch failed (${paymentsResponse.status})`)
      const paymentsBody=await paymentsResponse.json() as {items?:Payment[]}
      const captured=(paymentsBody.items||[]).filter(payment=>payment.order_id===link!.order_id&&payment.status==='captured'&&payment.amount===expectedPaise&&String(payment.currency||'').toUpperCase()==='INR')
      if(captured.length!==1||!captured[0].id)return json({error:'A unique captured payment could not be proven for this paid Payment Link.'},409)
      const payment=captured[0]
      const {error:bindError}=await admin.from('payment_attempts').update({provider_session_id:link.id,provider_order_id:link.order_id,updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('provider','razorpay')
      if(bindError)throw bindError
      if(attempt.status==='captured'&&attempt.provider_payment_id===payment.id)return json({ok:true,status:'paid',alreadyProcessed:true})
      if(!['created','pending'].includes(attempt.status))return json({error:'Internal payment attempt is not eligible for capture reconciliation.'},409)
      const {error:prepareError}=await admin.from('payment_attempts').update({status:'pending',failure_code:null,updated_at:new Date().toISOString()}).eq('id',attempt.id).eq('provider','razorpay').in('status',['created','pending'])
      if(prepareError)throw prepareError
      const {error:finalizeError}=await admin.rpc('finalize_razorpay_payment',{p_order_id:attempt.order_id,p_attempt_id:attempt.id,p_payment_id:payment.id});if(finalizeError)throw finalizeError
      return json({ok:true,status:'paid',detail:'Provider-paid session reconciled against a unique captured payment.'})
    }
    return json({error:`Unsupported provider session status: ${String(link.status||'unknown')}`},409)
  }catch(error){console.error('admin_payment_reconciliation_failed',error);return json({error:'Unable to reconcile the provider payment session safely.'},502)}
}
