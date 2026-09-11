import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'

export const runtime='nodejs'
const MAX_BODY_BYTES=2048
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Params={params:Promise<{id:string}>}
type Body={action?:'review'|'publish';reviewType?:'scientific'|'compliance';decision?:'approved'|'rejected'|'changes_requested';comment?:string}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return true
  const origin=request.headers.get('origin'); if(!origin) return true
  try{
    const supplied=new URL(origin).origin
    const requestOrigin=new URL(request.url).origin
    const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin
    return supplied!==requestOrigin&&supplied!==configured
  }catch{return true}
}

export async function POST(request:Request,{params}:Params){
  if(invalidOrigin(request)) return json({error:'Invalid claim control origin.'},403)
  const {id}=await params
  if(!UUID.test(id)) return json({error:'Invalid claim identifier.'},400)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder') return json({error:'Admin access required.'},403)

  let raw=''
  try{raw=await request.text()}catch{return json({error:'Invalid request.'},400)}
  if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES) return json({error:'Request is too large.'},413)
  let body:Body
  try{body=JSON.parse(raw||'{}') as Body}catch{return json({error:'Invalid request.'},400)}

  const admin=createAdminClient()
  if(body.action==='publish'){
    const {error}=await admin.rpc('server_publish_claim',{p_actor_id:user.id,p_actor_role:role,p_claim_id:id})
    if(error){console.error('server_claim_publish_failed',error);return json({error:'Unable to publish this claim. Confirm both required reviews and approved evidence are complete.'},409)}
    return json({ok:true,status:'published'})
  }

  if(body.action!=='review'||!['scientific','compliance'].includes(String(body.reviewType))||!['approved','rejected','changes_requested'].includes(String(body.decision))) return json({error:'Invalid claim review action.'},400)
  const comment=typeof body.comment==='string'?body.comment.trim().slice(0,1000):null
  const {error}=await admin.rpc('server_review_claim',{
    p_actor_id:user.id,p_actor_role:role,p_claim_id:id,p_review_type:body.reviewType,p_decision:body.decision,p_comment:comment||null
  })
  if(error){console.error('server_claim_review_failed',error);return json({error:'Unable to record this review. Verify the claim stage and required evidence.'},409)}
  return json({ok:true,status:'reviewed'})
}
