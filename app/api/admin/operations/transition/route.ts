import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'
const MAX_BODY_BYTES=8192
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Body={kind?:'fulfillment'|'support'|'warranty';id?:string;status?:string;note?:string;carrier?:string;trackingNumber?:string;trackingUrl?:string}
function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin');if(!origin)return true
  try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin;return supplied!==requestOrigin&&supplied!==configured}catch{return true}
}

export async function POST(request:Request){
  if(invalidOrigin(request))return json({error:'Invalid Operations request origin.'},403)
  const contentType=request.headers.get('content-type')||''
  if(!contentType.toLowerCase().startsWith('application/json'))return json({error:'Unsupported media type.'},415)
  const length=request.headers.get('content-length');if(length&&Number(length)>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'');if(role!=='admin'&&role!=='founder')return json({error:'Admin access required.'},403)
  const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  let body:Body;try{body=JSON.parse(raw||'{}') as Body}catch{return json({error:'Invalid request.'},400)}
  const id=clean(body.id,36);const status=clean(body.status,64);if(!UUID.test(id)||!status)return json({error:'Invalid Operations transition.'},400)
  const admin=createAdminClient()

  if(body.kind==='fulfillment'){
    const carrier=clean(body.carrier,120);const trackingNumber=clean(body.trackingNumber,160);const trackingUrl=clean(body.trackingUrl,500)
    const {error}=await admin.rpc('server_transition_order_fulfillment',{p_actor_id:user.id,p_actor_role:role,p_order_id:id,p_status:status,p_carrier:carrier||null,p_tracking_number:trackingNumber||null,p_tracking_url:trackingUrl||null})
    if(error){console.error('server_fulfillment_transition_failed',error);return json({error:'Unable to update fulfillment safely.'},409)}
    return json({ok:true,status})
  }
  if(body.kind==='support'){
    const note=clean(body.note,2000)
    const {error}=await admin.rpc('server_transition_support_ticket',{p_actor_id:user.id,p_actor_role:role,p_ticket_id:id,p_status:status,p_comment:note||null})
    if(error){console.error('server_support_transition_failed',error);return json({error:'Unable to update the support ticket safely.'},409)}
    return json({ok:true,status})
  }
  if(body.kind==='warranty'){
    const note=clean(body.note,2000)
    const {error}=await admin.rpc('server_transition_warranty_claim',{p_actor_id:user.id,p_actor_role:role,p_claim_id:id,p_status:status,p_resolution_note:note||null})
    if(error){console.error('server_warranty_transition_failed',error);return json({error:'Unable to update the warranty claim safely.'},409)}
    return json({ok:true,status})
  }
  return json({error:'Invalid Operations transition kind.'},400)
}
