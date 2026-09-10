import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import './account.css'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA ACCOUNT</p><h1>Sign in to continue.</h1><p>Manage registered products, warranty, orders and support.</p><Link className="pill light" href="/login">Sign in</Link></section></div></main>
    )
  }

  const [{ data: registrations }, { data: orders }] = await Promise.all([
    supabase.from('product_registrations').select('id,registered_at,serial_id').order('registered_at',{ascending:false}),
    supabase.from('orders').select('id,order_number,status,total,currency,created_at').order('created_at',{ascending:false}).limit(10),
  ])

  return (
    <main className="page-wrap"><div className="shell">
      <section className="page-head"><p className="kicker">MY RADVORA</p><h1>Your account.</h1><p>{user.email}</p></section>
      <div className="account-grid">
        <section className="panel"><span className="kicker">REGISTERED PRODUCTS</span><h2>{registrations?.length ?? 0}</h2>{registrations?.length ? registrations.map(r=><div className="account-row" key={r.id}><div><b>Registered product</b><span>{new Date(r.registered_at).toLocaleDateString('en-IN')}</span></div><em>active</em></div>) : <p className="empty-state">No products registered yet.</p>}<div className="actions"><Link className="pill ghost" href="/verify">Verify product →</Link></div></section>
        <section className="panel"><span className="kicker">ORDERS</span><h2>{orders?.length ?? 0}</h2>{orders?.length ? orders.map(o=><div className="account-row" key={o.id}><div><b>{o.order_number}</b><span>{new Intl.NumberFormat('en-IN',{style:'currency',currency:o.currency || 'INR'}).format(Number(o.total || 0))}</span></div><em>{o.status}</em></div>) : <p className="empty-state">No orders yet.</p>}</section>
        <section className="panel"><span className="kicker">SUPPORT</span><h2>Product care</h2><p className="empty-state">Warranty, installation guidance and support history will live here.</p><div className="actions"><Link className="pill ghost" href="/compatibility">Check compatibility →</Link><Link className="pill ghost" href="/labs">View Labs →</Link></div></section>
      </div>
    </div></main>
  )
}
