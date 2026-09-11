import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'

export const runtime='nodejs'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_BODY_BYTES=4096

type Params={params:Promise<{id:string}>}
type Body={enabled?:boolean;autonomyLevel?:number;allowedTools?:unknown;guardrails?:Record<string,unknown>}

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
  if(invalidOrigin(request)) return json({error:'Invalid agent control origin.'},403)
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'Content-Type must be application/json.'},415)
  const {id}=await params
  if(!UUID.test(id)) return json({error:'Invalid agent identifier.'},400)
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder') return json({error:'Admin access required.'},403)
  let raw='';try{raw=await request.text()}catch{return json({error:'Invalid request.'},400)}
  if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES) return json({error:'Request is too large.'},413)
  let body:Body;try{body=JSON.parse(raw||'{}') as Body}catch{return json({error:'Invalid request.'},400)}
  if(typeof body.enabled!=='boolean'||!Number.isInteger(body.autonomyLevel)||Number(body.autonomyLevel)<1||Number(body.autonomyLevel)>4) return json({error:'Invalid agent configuration.'},400)
  if(!Array.isArray(body.allowedTools)||body.allowedTools.length>50||body.allowedTools.some(v=>typeof v!=='string'||v.length<1||v.length>100)) return json({error:'Invalid allowed tools.'},400)
  const guardrails=body.guardrails&&typeof body.guardrails==='object'?body.guardrails:{}
  const admin=createAdminClient()
  const {error}=await admin.rpc('server_set_agent_configuration',{
    p_actor_id:user.id,p_actor_role:role,p_agent_id:id,p_enabled:body.enabled,p_autonomy_level:body.autonomyLevel,p_allowed_tools:body.allowedTools,p_guardrails:guardrails
  })
  if(error){console.error('server_agent_config_failed',error);return json({error:'Unable to save this agent configuration. Founder approval is required for level 4 activation and level 5 remains disabled.'},409)}
  return json({ok:true})
}
