import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'

export const runtime='nodejs'
export const maxDuration=10
const MAX_BODY_BYTES=2048
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const RESPONSE_HEADERS={
  'Cache-Control':'no-store',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const

type Params={params:Promise<{id:string}>}
type Body={action?:'review'|'publish';reviewType?:'scientific'|'compliance';decision?:'approved'|'rejected'|'changes_requested';comment?:string}

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
      // Privileged production claim control must fail closed instead of trusting request.url.
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
    if(!Number.isSafeInteger(declaredLength)||declaredLength<0)return json({error:'Invalid claim control request length.'},400)
    if(declaredLength>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  }
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Content-Type must be application/json.'},415)
  if(invalidOrigin(request,canonical))return json({error:'Invalid claim control origin.'},403)
  return null
}

export async function POST(request:Request,{params}:Params){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin)return json({error:'Claim administration is temporarily unavailable.'},503)
  const requestError=boundary(request,expectedOrigin)
  if(requestError)return requestError

  const {id}=await params
  if(!UUID.test(id)) return json({error:'Invalid claim identifier.'},400)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder') return json({error:'Admin access required.'},403)

  let rawBytes:ArrayBuffer
  try{rawBytes=await request.arrayBuffer()}catch{return json({error:'Invalid request.'},400)}
  if(rawBytes.byteLength>MAX_BODY_BYTES) return json({error:'Request is too large.'},413)
  let parsed:unknown
  try{parsed=JSON.parse(Buffer.from(rawBytes).toString('utf8')||'{}')}catch{return json({error:'Invalid request.'},400)}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'Invalid request.'},400)
  const body=parsed as Body

  const admin=createAdminClient()
  if(body.action==='publish'){
    const {error}=await admin.rpc('server_publish_claim',{p_actor_id:user.id,p_actor_role:role,p_claim_id:id})
    if(error){console.error('server_claim_publish_failed');return json({error:'Unable to publish this claim. Confirm both required reviews and approved evidence are complete.'},409)}
    return json({ok:true,status:'published'})
  }

  if(body.action!=='review'||!['scientific','compliance'].includes(String(body.reviewType))||!['approved','rejected','changes_requested'].includes(String(body.decision))) return json({error:'Invalid claim review action.'},400)
  const comment=typeof body.comment==='string'?body.comment.trim().slice(0,1000):null
  const {error}=await admin.rpc('server_review_claim',{
    p_actor_id:user.id,p_actor_role:role,p_claim_id:id,p_review_type:body.reviewType,p_decision:body.decision,p_comment:comment||null
  })
  if(error){console.error('server_claim_review_failed');return json({error:'Unable to record this review. Verify the claim stage and required evidence.'},409)}
  return json({ok:true,status:'reviewed'})
}
