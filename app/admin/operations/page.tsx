import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import CaseActions from './case-actions'
import FulfillmentActions from './fulfillment-actions'
import RefundOrderButton from './refund-order-button'
import PaymentReconcileButton from './payment-reconcile-button'

export const dynamic='force-dynamic'

type ReservedItem={order_id:string;inventory_reserved_quantity:number;orders:{order_number:string;status:string;created_at:string}|null;products:{name:string;sku:string}|null}
type PaymentState={id:string;order_id:string;provider:string;status:string;created_at:string;provider_session_id:string|null;provider_session_expires_at:string|null}

export default async function AdminOperationsPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">OPERATIONS</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>}
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder'){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>}

  const [{data:orders},{data:payments},{data:refunds},{data:support},{data:warranty},{data:reservedRows}]=await Promise.all([
    supabase.from('orders').select('id,order_number,email,status,total,currency,created_at,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,fulfillment_carrier,tracking_number,tracking_url,shipped_at,delivered_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('payment_attempts').select('id,order_id,provider,amount,currency,status,failure_code,provider_session_id,provider_session_expires_at,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('refund_attempts').select('id,order_id,amount,currency,status,reason,provider_refund_id,failure_code,created_at,processed_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('support_tickets').select('id,subject,status,created_at,user_id').order('created_at',{ascending:false}).limit(20),
    supabase.from('warranty_claims').select('id,issue_type,status,resolution_note,created_at,user_id').order('created_at',{ascending:false}).limit(20),
    supabase.from('order_items').select('order_id,inventory_reserved_quantity,orders(order_number,status,created_at),products(name,sku)').gt('inventory_reserved_quantity',0).limit(100)
  ])

  const money=(amount:number|string|null,currency='INR')=>new Intl.NumberFormat('en-IN',{style:'currency',currency:currency||'INR'}).format(Number(amount||0))
  const gatewayReady=Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)
  const refundsByOrder=new Map((refunds||[]).map(refund=>[refund.order_id,refund]))
  const now=Date.now()
  const reserved=(reservedRows||[]) as unknown as ReservedItem[]
  const staleReservations=reserved.filter(row=>row.orders?.status==='pending'&&now-Date.parse(row.orders.created_at)>60*60*1000)
  const staleOrderIds=[...new Set(staleReservations.map(row=>row.order_id))]
  let stalePaymentRows:PaymentState[]=[]
  if(staleOrderIds.length){
    const {data}=await supabase.from('payment_attempts').select('id,order_id,provider,status,created_at,provider_session_id,provider_session_expires_at').in('order_id',staleOrderIds).order('created_at',{ascending:false})
    stalePaymentRows=(data||[]) as PaymentState[]
  }
  const latestPaymentByOrder=new Map<string,PaymentState>()
  for(const payment of stalePaymentRows){if(!latestPaymentByOrder.has(payment.order_id))latestPaymentByOrder.set(payment.order_id,payment)}

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA OPERATIONS</span><h1>Orders, payments, inventory and customer care.</h1><p>Payment/refund completion remains provider-verified. Inventory reservations are never auto-released solely because of age: stale pending reservations require exact provider reconciliation first.</p><div className="actions"><Link className="pill ghost" href="/admin">← Admin dashboard</Link></div></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">STALE INVENTORY RESERVATIONS</span><h2>{staleReservations.length}</h2>{staleReservations.length?staleReservations.map((row,index)=>{const payment=latestPaymentByOrder.get(row.order_id);return <div className="admin-row" key={`${row.order_id}-${index}`}><div><b>{row.orders?.order_number||row.order_id}</b><span>{row.products?.name||row.products?.sku||'Product'} · {row.inventory_reserved_quantity} reserved · order pending since {row.orders?.created_at?new Date(row.orders.created_at).toLocaleString('en-IN'):'unknown'}</span><p className="empty-state">Latest local payment state: {payment?`${payment.provider} ${payment.status} · ${new Date(payment.created_at).toLocaleString('en-IN')}${payment.provider_session_expires_at?` · session expiry ${new Date(payment.provider_session_expires_at).toLocaleString('en-IN')}`:''}`:'no payment attempt recorded'}. Reconciliation fetches the provider directly; no admin can manually declare payment.</p>{payment?<PaymentReconcileButton attemptId={payment.id}/>:null}</div><em>REVIEW</em></div>}):<p className="empty-state">No pending inventory reservation older than one hour was found in the loaded reservation set.</p>}</section>
      <section className="panel"><span className="kicker">RECENT ORDERS</span><h2>{orders?.length??0}</h2>{orders?.length?orders.map(order=>{const refund=refundsByOrder.get(order.id);return <div className="admin-row" key={order.id}><div style={{flex:1}}><b>{order.order_number}</b><span>{order.email||'No email'} · {money(order.total,order.currency)} · {order.status}</span>{order.shipping_line1?<p className="empty-state">Ship to: {order.shipping_name||'Customer'} · {order.shipping_line1}{order.shipping_line2?`, ${order.shipping_line2}`:''}, {order.shipping_city||''} {order.shipping_postal_code||''}, {order.shipping_state||''} {order.shipping_country||''}{order.shipping_phone?` · ${order.shipping_phone}`:''}</p>:order.status!=='pending'?<p className="empty-state">Shipping address not yet captured.</p>:null}{order.fulfillment_carrier&&order.tracking_number?<p className="empty-state">{order.fulfillment_carrier} · {order.tracking_number}{order.tracking_url?<><br/><a href={order.tracking_url} target="_blank" rel="noreferrer">Open tracking →</a></>:null}</p>:null}{refund?<p className="empty-state">Refund: {refund.status} · {money(refund.amount,refund.currency)} · {refund.reason}</p>:null}<FulfillmentActions id={order.id} status={order.status} carrier={order.fulfillment_carrier} trackingNumber={order.tracking_number} trackingUrl={order.tracking_url}/>{['paid','processing'].includes(order.status)&&!refund?<RefundOrderButton orderId={order.id} gatewayReady={gatewayReady}/>:null}</div></div>}):<p className="empty-state">No orders yet.</p>}</section>
      <section className="panel"><span className="kicker">PAYMENT ATTEMPTS</span><h2>{payments?.length??0}</h2>{payments?.length?payments.map(payment=><div className="admin-row" key={payment.id}><div style={{flex:1}}><b>{payment.provider}</b><span>{money(payment.amount,payment.currency)}{payment.failure_code?` · ${payment.failure_code}`:''}{payment.provider_session_expires_at?` · session expires ${new Date(payment.provider_session_expires_at).toLocaleString('en-IN')}`:''}</span>{payment.provider==='razorpay'&&payment.provider_session_id&&['created','pending'].includes(payment.status)?<PaymentReconcileButton attemptId={payment.id}/>:null}</div><em>{payment.status}</em></div>):<p className="empty-state">No payment attempts yet.</p>}</section>
      <section className="panel"><span className="kicker">REFUNDS</span><h2>{refunds?.length??0}</h2>{refunds?.length?refunds.map(refund=><div className="admin-row" key={refund.id}><div><b>{money(refund.amount,refund.currency)}</b><span>{refund.reason} · {new Date(refund.created_at).toLocaleString('en-IN')}{refund.provider_refund_id?` · ${refund.provider_refund_id}`:''}{refund.failure_code?` · ${refund.failure_code}`:''}</span></div><em>{refund.status}</em></div>):<p className="empty-state">No refunds yet.</p>}</section>
      <section className="panel"><span className="kicker">SUPPORT QUEUE</span><h2>{support?.length??0}</h2>{support?.length?support.map(ticket=><div className="admin-row" key={ticket.id}><div style={{flex:1}}><b>{ticket.subject}</b><span>{new Date(ticket.created_at).toLocaleDateString('en-IN')} · {ticket.status.replaceAll('_',' ')}</span><CaseActions kind="support" id={ticket.id} status={ticket.status}/></div></div>):<p className="empty-state">No support tickets yet.</p>}</section>
      <section className="panel"><span className="kicker">WARRANTY QUEUE</span><h2>{warranty?.length??0}</h2>{warranty?.length?warranty.map(claim=><div className="admin-row" key={claim.id}><div style={{flex:1}}><b>{claim.issue_type.replaceAll('_',' ')}</b><span>{new Date(claim.created_at).toLocaleDateString('en-IN')} · {claim.status.replaceAll('_',' ')}</span>{claim.resolution_note?<p className="empty-state">Resolution: {claim.resolution_note}</p>:null}<CaseActions kind="warranty" id={claim.id} status={claim.status}/></div></div>):<p className="empty-state">No warranty claims yet.</p>}</section>
    </div>
  </div></main>
}
