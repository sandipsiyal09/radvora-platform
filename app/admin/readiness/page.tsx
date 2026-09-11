import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic='force-dynamic'

type Check={label:string;ready:boolean;detail:string;href?:string}

type AgentRow={id:string;name:string;enabled:boolean;autonomy_level:number;allowed_tools:unknown}
type GuardrailRow={agent_id:string;max_single_spend:number|string|null;max_daily_spend:number|string|null;require_approval_for_external_publish:boolean;require_approval_for_money:boolean;require_approval_for_claims:boolean}

export default async function ReadinessPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">LAUNCH READINESS</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder')return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>

  const admin=createAdminClient()
  const [{data:products},{count:pendingApprovals},{count:failedWebhooks},{count:openRefunds},{count:failedRefunds},{data:agents},{data:guardrails}]=await Promise.all([
    supabase.from('products').select('id,name,status,price_inr,currency,commerce_enabled,hsn_code,gst_rate,price_inr_includes_gst').order('name'),
    supabase.from('approvals').select('*',{count:'exact',head:true}).eq('status','pending'),
    admin.from('payment_webhook_events').select('*',{count:'exact',head:true}).eq('processing_status','failed'),
    admin.from('refund_attempts').select('*',{count:'exact',head:true}).in('status',['requested','submitting','pending']),
    admin.from('refund_attempts').select('*',{count:'exact',head:true}).eq('status','failed'),
    supabase.from('ai_agents').select('id,name,enabled,autonomy_level,allowed_tools'),
    supabase.from('agent_guardrails').select('agent_id,max_single_spend,max_daily_spend,require_approval_for_external_publish,require_approval_for_money,require_approval_for_claims')
  ])

  const catalog=products||[]
  const hasTaxConfig=(p:(typeof catalog)[number])=>Boolean(p.hsn_code&&/^\d{4,8}$/.test(String(p.hsn_code))&&p.gst_rate!==null&&Number(p.gst_rate)>=0&&Number(p.gst_rate)<=100&&p.price_inr_includes_gst!==null)
  const sellable=catalog.filter(p=>p.status==='active'&&p.commerce_enabled===true&&p.currency==='INR'&&Number(p.price_inr)>0&&hasTaxConfig(p))
  const activeMissingPrice=catalog.filter(p=>p.status==='active'&&(p.price_inr===null||Number(p.price_inr)<=0))
  const activeMissingTax=catalog.filter(p=>p.status==='active'&&!hasTaxConfig(p))
  const commerceMisconfigured=catalog.filter(p=>p.commerce_enabled===true&&(p.status!=='active'||p.currency!=='INR'||p.price_inr===null||Number(p.price_inr)<=0||!hasTaxConfig(p)))
  const gatewayReady=Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)
  const appUrl=process.env.NEXT_PUBLIC_APP_URL?.trim()||''
  const canonicalReady=appUrl.startsWith('https://')
  const paymentOpsHealthy=(failedWebhooks??0)===0&&(openRefunds??0)===0&&(failedRefunds??0)===0

  const guardrailByAgent=new Map(((guardrails||[]) as GuardrailRow[]).map(row=>[row.agent_id,row]))
  const unsafeAgents=((agents||[]) as AgentRow[]).filter(agent=>{
    if(!agent.enabled) return false
    const guard=guardrailByAgent.get(agent.id)
    const tools=Array.isArray(agent.allowed_tools)?agent.allowed_tools:[]
    return !guard||agent.autonomy_level>=4||tools.length===0||guard.require_approval_for_external_publish!==true||guard.require_approval_for_money!==true||guard.require_approval_for_claims!==true
  })
  const enabledAgents=((agents||[]) as AgentRow[]).filter(agent=>agent.enabled)

  const checks:Check[]=[
    {label:'Indian payment gateway',ready:gatewayReady,detail:gatewayReady?'Razorpay server keys and webhook secret are configured.':'Production Razorpay key ID, key secret and webhook secret are still required.',href:'/api/health'},
    {label:'Sellable India catalog',ready:sellable.length>0,detail:sellable.length?`${sellable.length} product${sellable.length===1?'':'s'} explicitly enabled with positive INR pricing and complete GST/HSN configuration.`:'No product is currently fully ready and enabled for India commerce.',href:'/admin/catalog'},
    {label:'Catalog pricing completeness',ready:activeMissingPrice.length===0,detail:activeMissingPrice.length?`${activeMissingPrice.length} active product${activeMissingPrice.length===1?' is':'s are'} still unpriced.`:'All active products have positive prices.',href:'/admin/catalog'},
    {label:'India GST/HSN completeness',ready:activeMissingTax.length===0,detail:activeMissingTax.length?`${activeMissingTax.length} active product${activeMissingTax.length===1?' is':'s are'} missing explicit HSN, GST rate or GST-inclusive/exclusive price treatment.`:'All active products have complete India tax configuration.',href:'/admin/catalog'},
    {label:'Commerce gate consistency',ready:commerceMisconfigured.length===0,detail:commerceMisconfigured.length?'One or more commerce-enabled products fail the active/INR/price/GST/HSN rules.':'No inconsistent commerce-enabled product records detected.',href:'/admin/catalog'},
    {label:'Payment operations ledger',ready:paymentOpsHealthy,detail:paymentOpsHealthy?'No failed webhook events or unresolved refund attempts are recorded.':`${failedWebhooks??0} failed webhook event${failedWebhooks===1?'':'s'}, ${openRefunds??0} open refund${openRefunds===1?'':'s'}, ${failedRefunds??0} failed refund${failedRefunds===1?'':'s'} require review.`,href:'/admin/operations'},
    {label:'AI autonomy safety',ready:unsafeAgents.length===0,detail:unsafeAgents.length===0?(enabledAgents.length===0?'All autonomous agents are disabled. Money, publishing and claims approval gates remain intact.':`${enabledAgents.length} enabled agent${enabledAgents.length===1?' is':'s are'} within launch guardrails.`):`${unsafeAgents.length} enabled agent${unsafeAgents.length===1?'':'s'} violates launch autonomy/approval guardrails.`,href:'/admin/ai'},
    {label:'Canonical application URL',ready:canonicalReady,detail:canonicalReady?`HTTPS application URL configured: ${appUrl}`:'NEXT_PUBLIC_APP_URL must be configured to the final HTTPS production domain before launch.'},
    {label:'Human approval queue',ready:(pendingApprovals??0)===0,detail:(pendingApprovals??0)===0?'No pending human approvals.':`${pendingApprovals??0} human approval${pendingApprovals===1?'':'s'} pending. Sensitive scientific/AI workflows remain gated.`,href:'/admin/ai'},
  ]
  const blockers=checks.filter(check=>!check.ready)

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA INDIA LAUNCH</span><h1>Launch readiness.</h1><p>This view reports configuration, statutory catalog, payment-operation and AI-safety blockers without exposing credentials. It does not bypass scientific, compliance, payment, tax or human approval controls.</p></section>
    <section className="panel"><span className="kicker">CURRENT STATE</span><h2>{blockers.length===0?'Core launch checks are green.':`${blockers.length} launch blocker${blockers.length===1?'':'s'} remain.`}</h2><p>{blockers.length===0?'Proceed only after deployment/runtime verification on the final production domain.':'Resolve the items below before enabling customer payment collection.'}</p></section>
    <div className="admin-grid">{checks.map(check=><article className="panel" key={check.label}><span className="kicker">{check.ready?'READY':'BLOCKED'}</span><h2>{check.label}</h2><p>{check.detail}</p>{check.href?<Link className="pill ghost" href={check.href}>Review →</Link>:null}</article>)}</div>
    <div className="actions"><Link className="pill ghost" href="/admin">← Admin dashboard</Link><Link className="pill ghost" href="/admin/catalog">Catalog</Link><Link className="pill ghost" href="/admin/operations">Operations</Link></div>
  </div></main>
}
