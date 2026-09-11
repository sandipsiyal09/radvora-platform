import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

export const dynamic='force-dynamic'

export default async function AdminPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">RADVORA ADMIN</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>}
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder'){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>}

  const [{count:products},{count:orders},{count:leads},{count:pendingApprovals},{count:support},{count:warranty}]=await Promise.all([
    supabase.from('products').select('*',{count:'exact',head:true}),
    supabase.from('orders').select('*',{count:'exact',head:true}),
    supabase.from('leads').select('*',{count:'exact',head:true}),
    supabase.from('approvals').select('*',{count:'exact',head:true}).eq('status','pending'),
    supabase.from('support_tickets').select('*',{count:'exact',head:true}),
    supabase.from('warranty_claims').select('*',{count:'exact',head:true}),
  ])

  const sections=[
    ['/admin/readiness','Launch Readiness','India payment, seller identity, catalog, domain and approval blockers','Pre-launch'],
    ['/admin/commerce','India Commerce','Verified seller/GST identity and invoice readiness','Statutory'],
    ['/admin/operations','Operations','Orders, payment attempts, inventory, support and warranty',`${orders??0} orders`],
    ['/admin/catalog','Catalog','Products, INR pricing, GST/HSN, inventory and product availability',`${products??0} products`],
    ['/admin/crm','CRM','Business, dealer, distributor and contact leads',`${leads??0} leads`],
    ['/admin/labs','Labs','Evidence, scientific reviews and public claims','Evidence gated'],
    ['/admin/ai','AI Command Center','Agent configuration, runs and human approvals',`${pendingApprovals??0} pending approvals`],
  ]

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA ADMIN OS</span><h1>Founder command dashboard.</h1><p>Operational views remain role-gated. Scientific claims, high-risk publishing and sensitive AI actions remain human-controlled.</p></section>
    <div className="command-stats"><div className="panel"><span>Orders</span><b>{orders??0}</b></div><div className="panel"><span>Support</span><b>{support??0}</b></div><div className="panel"><span>Warranty</span><b>{warranty??0}</b></div><div className="panel"><span>Approvals</span><b>{pendingApprovals??0}</b></div></div>
    <section className="admin-grid">{sections.map(([href,title,description,status])=><article className="panel" key={href}><span className="kicker">{status}</span><h2>{title}</h2><p>{description}</p><Link className="pill light" href={href}>Open {title} →</Link></article>)}</section>
  </div></main>
}
