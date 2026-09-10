import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import RegisterProduct from './register-product'
import CustomerCare from './customer-care'
import './account.css'

export const dynamic = 'force-dynamic'

type SerialRow={id:string;serial_number:string;products:{name:string}|null}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA ACCOUNT</p><h1>Sign in to continue.</h1><p>Manage registered products, warranty, orders and support.</p><Link className="pill light" href="/login">Sign in</Link></section></div></main>
  }

  const [{ data: registrations }, { data: serialRows }, { data: orders }, {data:supportTickets}, {data:warrantyClaims}] = await Promise.all([
    supabase.from('product_registrations').select('id,registered_at,serial_id').order('registered_at',{ascending:false}),
    supabase.from('product_serials').select('id,serial_number,products(name)').eq('activated_by',user.id).order('created_at',{ascending:false}),
    supabase.from('orders').select('id,order_number,status,total,currency,created_at').order('created_at',{ascending:false}).limit(10),
    supabase.from('support_tickets').select('id,subject,status,created_at').order('created_at',{ascending:false}).limit(5),
    supabase.from('warranty_claims').select('id,issue_type,status,created_at').order('created_at',{ascending:false}).limit(5),
  ])

  const serials=((serialRows||[]) as unknown as SerialRow[]).map(row=>({id:row.id,serial_number:row.serial_number,product_name:row.products?.name||'RADVORA product'}))

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><p className="kicker">MY RADVORA</p><h1>Your account.</h1><p>{user.email}</p><div className="actions"><Link className="pill ghost" href="/cart">Open cart →</Link><Link className="pill ghost" href="/verify">Verify product →</Link></div></section>
    <div className="account-grid">
      <section className="panel"><span className="kicker">REGISTERED PRODUCTS</span><h2>{registrations?.length ?? 0}</h2>{serials.length?serials.map(s=><div className="account-row" key={s.id}><div><b>{s.product_name}</b><span>{s.serial_number}</span></div><em>active</em></div>):<p className="empty-state">No products registered yet.</p>}</section>
      <section className="panel"><span className="kicker">ORDERS</span><h2>{orders?.length ?? 0}</h2>{orders?.length ? orders.map(o=><div className="account-row" key={o.id}><div><b>{o.order_number}</b><span>{new Intl.NumberFormat('en-IN',{style:'currency',currency:o.currency || 'INR'}).format(Number(o.total || 0))}</span></div><em>{o.status}</em></div>) : <p className="empty-state">No orders yet.</p>}</section>
      <section className="panel"><span className="kicker">CARE HISTORY</span><h2>{(supportTickets?.length||0)+(warrantyClaims?.length||0)}</h2>{supportTickets?.map(t=><div className="account-row" key={t.id}><div><b>{t.subject}</b><span>Support ticket</span></div><em>{t.status}</em></div>)}{warrantyClaims?.map(w=><div className="account-row" key={w.id}><div><b>{w.issue_type.replaceAll('_',' ')}</b><span>Warranty request</span></div><em>{w.status}</em></div>)}{!supportTickets?.length&&!warrantyClaims?.length?<p className="empty-state">No support or warranty cases yet.</p>:null}</section>
    </div>
    <section className="panel register-panel"><RegisterProduct /></section>
    <CustomerCare serials={serials}/>
  </div></main>
}
