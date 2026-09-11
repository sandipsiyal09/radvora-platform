import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic='force-dynamic'

type Check={label:string;ready:boolean;detail:string;href?:string}

export default async function ReadinessPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">LAUNCH READINESS</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder')return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>

  const [{data:products},{count:pendingApprovals}]=await Promise.all([
    supabase.from('products').select('id,name,status,price_inr,currency,commerce_enabled').order('name'),
    supabase.from('approvals').select('*',{count:'exact',head:true}).eq('status','pending')
  ])

  const catalog=products||[]
  const sellable=catalog.filter(p=>p.status==='active'&&p.commerce_enabled===true&&p.currency==='INR'&&Number(p.price_inr)>0)
  const activeMissingPrice=catalog.filter(p=>p.status==='active'&&(p.price_inr===null||Number(p.price_inr)<=0))
  const commerceMisconfigured=catalog.filter(p=>p.commerce_enabled===true&&(p.status!=='active'||p.currency!=='INR'||p.price_inr===null||Number(p.price_inr)<=0))
  const gatewayReady=Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)
  const appUrl=process.env.NEXT_PUBLIC_APP_URL?.trim()||''
  const canonicalReady=appUrl.startsWith('https://')

  const checks:Check[]=[
    {label:'Indian payment gateway',ready:gatewayReady,detail:gatewayReady?'Razorpay server keys and webhook secret are configured.':'Production Razorpay key ID, key secret and webhook secret are still required.',href:'/api/health'},
    {label:'Sellable India catalog',ready:sellable.length>0,detail:sellable.length?`${sellable.length} product${sellable.length===1?'':'s'} explicitly enabled for India commerce.`:'No product is currently commerce-enabled with a positive INR price.',href:'/admin/catalog'},
    {label:'Catalog pricing completeness',ready:activeMissingPrice.length===0,detail:activeMissingPrice.length?`${activeMissingPrice.length} active product${activeMissingPrice.length===1?' is':'s are'} still unpriced.`:'All active products have positive prices.',href:'/admin/catalog'},
    {label:'Commerce gate consistency',ready:commerceMisconfigured.length===0,detail:commerceMisconfigured.length?'One or more commerce-enabled products fail the active/INR/positive-price rules.':'No inconsistent commerce-enabled product records detected.',href:'/admin/catalog'},
    {label:'Canonical application URL',ready:canonicalReady,detail:canonicalReady?`HTTPS application URL configured: ${appUrl}`:'NEXT_PUBLIC_APP_URL must be configured to the final HTTPS production domain before launch.'},
    {label:'Human approval queue',ready:(pendingApprovals??0)===0,detail:(pendingApprovals??0)===0?'No pending human approvals.':`${pendingApprovals??0} human approval${pendingApprovals===1?'':'s'} pending. Sensitive scientific/AI workflows remain gated.`,href:'/admin/ai'},
  ]
  const blockers=checks.filter(check=>!check.ready)

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA INDIA LAUNCH</span><h1>Launch readiness.</h1><p>This view reports configuration and catalog blockers without exposing credentials. It does not bypass scientific, compliance, payment or human approval controls.</p></section>
    <section className="panel"><span className="kicker">CURRENT STATE</span><h2>{blockers.length===0?'Core launch checks are green.':`${blockers.length} launch blocker${blockers.length===1?'':'s'} remain.`}</h2><p>{blockers.length===0?'Proceed only after deployment/runtime verification on the final production domain.':'Resolve the items below before enabling customer payment collection.'}</p></section>
    <div className="admin-grid">{checks.map(check=><article className="panel" key={check.label}><span className="kicker">{check.ready?'READY':'BLOCKED'}</span><h2>{check.label}</h2><p>{check.detail}</p>{check.href?<Link className="pill ghost" href={check.href}>Review →</Link>:null}</article>)}</div>
    <div className="actions"><Link className="pill ghost" href="/admin">← Admin dashboard</Link><Link className="pill ghost" href="/admin/catalog">Catalog</Link><Link className="pill ghost" href="/admin/operations">Operations</Link></div>
  </div></main>
}
