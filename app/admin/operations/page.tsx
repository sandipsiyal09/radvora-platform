import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import CaseActions from './case-actions'

export const dynamic='force-dynamic'

export default async function AdminOperationsPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">OPERATIONS</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>}
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder'){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>}

  const [{data:orders},{data:payments},{data:support},{data:warranty}]=await Promise.all([
    supabase.from('orders').select('id,order_number,email,status,total,currency,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('payment_attempts').select('id,order_id,provider,amount,currency,status,failure_code,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('support_tickets').select('id,subject,status,created_at,user_id').order('created_at',{ascending:false}).limit(20),
    supabase.from('warranty_claims').select('id,issue_type,status,resolution_note,created_at,user_id').order('created_at',{ascending:false}).limit(20),
  ])

  const money=(amount:number|string|null,currency='INR')=>new Intl.NumberFormat('en-IN',{style:'currency',currency:currency||'INR'}).format(Number(amount||0))

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA OPERATIONS</span><h1>Orders, payments and customer care.</h1><p>Payment completion remains webhook-driven. Support and warranty decisions below use role-gated database workflows with audit logging and controlled state transitions.</p><div className="actions"><Link className="pill ghost" href="/admin">← Admin dashboard</Link></div></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">RECENT ORDERS</span><h2>{orders?.length??0}</h2>{orders?.length?orders.map(order=><div className="admin-row" key={order.id}><div><b>{order.order_number}</b><span>{order.email||'No email'} · {money(order.total,order.currency)}</span></div><em>{order.status}</em></div>):<p className="empty-state">No orders yet.</p>}</section>
      <section className="panel"><span className="kicker">PAYMENT ATTEMPTS</span><h2>{payments?.length??0}</h2>{payments?.length?payments.map(payment=><div className="admin-row" key={payment.id}><div><b>{payment.provider}</b><span>{money(payment.amount,payment.currency)}{payment.failure_code?` · ${payment.failure_code}`:''}</span></div><em>{payment.status}</em></div>):<p className="empty-state">No payment attempts yet.</p>}</section>
      <section className="panel"><span className="kicker">SUPPORT QUEUE</span><h2>{support?.length??0}</h2>{support?.length?support.map(ticket=><div className="admin-row" key={ticket.id}><div style={{flex:1}}><b>{ticket.subject}</b><span>{new Date(ticket.created_at).toLocaleDateString('en-IN')} · {ticket.status.replaceAll('_',' ')}</span><CaseActions kind="support" id={ticket.id} status={ticket.status}/></div></div>):<p className="empty-state">No support tickets yet.</p>}</section>
      <section className="panel"><span className="kicker">WARRANTY QUEUE</span><h2>{warranty?.length??0}</h2>{warranty?.length?warranty.map(claim=><div className="admin-row" key={claim.id}><div style={{flex:1}}><b>{claim.issue_type.replaceAll('_',' ')}</b><span>{new Date(claim.created_at).toLocaleDateString('en-IN')} · {claim.status.replaceAll('_',' ')}</span>{claim.resolution_note?<p className="empty-state">Resolution: {claim.resolution_note}</p>:null}<CaseActions kind="warranty" id={claim.id} status={claim.status}/></div></div>):<p className="empty-state">No warranty claims yet.</p>}</section>
    </div>
  </div></main>
}
