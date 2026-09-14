import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'
export const maxDuration=10
const MAX_BODY_BYTES=8192
const RESPONSE_HEADERS={
  'Cache-Control':'no-store',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const

type Body={legalName?:string;gstin?:string;registeredState?:string;registeredStateCode?:string;addressLine1?:string;addressLine2?:string;city?:string;postalCode?:string;supportEmail?:string}
function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:RESPONSE_HEADERS})}
function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
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
      // Privileged production seller-profile writes must fail closed instead of trusting request.url.
    }
  }
  if(isProductionRuntime())return null
  try{
    const url=new URL(request.url)
    return url.protocol==='https:'||url.hostname==='localhost'?url.origin:null
  }catch{return null}
}
function invalidOrigin(request:Request,canonical:string){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin')
  if(!origin)return true
  try{
    const supplied=new URL(origin).origin
    if(isProductionRuntime())return supplied!==canonical
    const requestOrigin=new URL(request.url).origin
    return supplied!==requestOrigin&&supplied!==canonical
  }catch{return true}
}
function boundary(request:Request,canonical:string){
  const rawLength=request.headers.get('content-length')
  if(rawLength){
    const declaredLength=Number(rawLength)
    if(!Number.isSafeInteger(declaredLength)||declaredLength<0)return json({error:'Invalid seller-profile request length.'},400)
    if(declaredLength>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  }
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Unsupported media type.'},415)
  if(invalidOrigin(request,canonical))return json({error:'Invalid seller-profile request origin.'},403)
  return null
}

export async function POST(request:Request){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin)return json({error:'Seller-profile administration is temporarily unavailable.'},503)
  const requestError=boundary(request,expectedOrigin)
  if(requestError)return requestError

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder')return json({error:'Admin access required.'},403)

  let rawBytes:ArrayBuffer
  try{rawBytes=await request.arrayBuffer()}catch{return json({error:'Unable to read seller-profile request.'},400)}
  if(rawBytes.byteLength>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  let parsed:unknown
  try{parsed=JSON.parse(Buffer.from(rawBytes).toString('utf8'))}catch{return json({error:'Invalid request.'},400)}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'Invalid request.'},400)
  const body=parsed as Body

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
  if(error){console.error('seller_profile_update_failed');return json({error:'Unable to save the seller profile safely.'},409)}
  return json({ok:true})
}
