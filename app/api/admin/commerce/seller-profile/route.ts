import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'
const MAX_BODY_BYTES=8192

type Body={legalName?:string;gstin?:string;registeredState?:string;registeredStateCode?:string;addressLine1?:string;addressLine2?:string;city?:string;postalCode?:string;supportEmail?:string}
function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin');if(!origin)return true
  try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin;return supplied!==requestOrigin&&supplied!==configured}catch{return true}
}

export async function POST(request:Request){
  if(invalidOrigin(request))return json({error:'Invalid seller-profile request origin.'},403)
  const length=request.headers.get('content-length');if(length&&Number(length)>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'');if(role!=='admin'&&role!=='founder')return json({error:'Admin access required.'},403)
  const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  let body:Body;try{body=JSON.parse(raw||'{}') as Body}catch{return json({error:'Invalid request.'},400)}

  const legalName=clean(body.legalName,200)
  const gstin=clean(body.gstin,15).toUpperCase()
  const registeredState=clean(body.registeredState,100)
  const registeredStateCode=clean(body.registeredStateCode,2)
  const addressLine1=clean(body.addressLine1,180)
  const addressLine2=clean(body.addressLine2,180)
  const city=clean(body.city,100)
  const postalCode=clean(body.postalCode,6)
  const supportEmail=clean(body.supportEmail,320).toLowerCase()
  if(legalName.length<2||!/^\d{2}[A-Z0-9]{13}$/.test(gstin)||!/^\d{2}$/.test(registeredStateCode)||!gstin.startsWith(registeredStateCode)||registeredState.length<2||addressLine1.length<5||city.length<2||!/^[1-9]\d{5}$/.test(postalCode)||supportEmail.length<3||!supportEmail.includes('@'))return json({error:'Enter complete verified India seller/GST registration details.'},400)

  const admin=createAdminClient()
  const {error}=await admin.rpc('server_set_india_seller_profile',{p_actor_id:user.id,p_actor_role:role,p_legal_name:legalName,p_gstin:gstin,p_registered_state:registeredState,p_registered_state_code:registeredStateCode,p_address_line1:addressLine1,p_address_line2:addressLine2,p_city:city,p_postal_code:postalCode,p_support_email:supportEmail})
  if(error){console.error('seller_profile_update_failed',error);return json({error:'Unable to save the seller profile safely.'},409)}
  return json({ok:true})
}
