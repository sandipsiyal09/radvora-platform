import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import RetryPaymentButton from './retry-payment-button'
import CancelOrderButton from './cancel-order-button'

export const dynamic = 'force-dynamic'

type PageProps={params:Promise<{id:string}>}
type OrderItem={id:string;quantity:number;unit_price:number;line_subtotal:number|null;tax_amount:number|null;line_total:number;hsn_code:string|null;gst_rate:number|null;price_includes_gst:boolean|null;products:{name:string;slug:string}|null}
type PaymentAttempt={id:string;provider:string;amount:number|string;currency:string;status:string;created_at:string;provider_session_expires_at:string|null}

export default async function OrderDetailPage({params}:PageProps){
  const {id}=await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ORDER DETAILS</span><h1>Sign in to continue.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>}

  const [{data:order},{data:itemRows},{data:paymentRows},{data:refunds}]=await Promise.all([
    supabase.from('orders').select('id,order_number,status,currency,subtotal,tax,shipping,total,payment_provider,payment_reference,created_at,updated_at,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,fulfillment_carrier,tracking_number,tracking_url,shipped_at,delivered_at,checkout_terms_accepted_at,checkout_terms_version').eq('id',id).eq('user_id',user.id).maybeSingle(),
    supabase.from('order_items').select('id,quantity,unit_price,line_subtotal,tax_amount,line_total,hsn_code,gst_rate,price_includes_gst,products(name,slug)').eq('order_id',id).order('created_at'),
    supabase.from('payment_attempts').select('id,provider,amount,currency,status,created_at,provider_session_expires_at').eq('order_id',id).order('created_at',{ascending:false}),
    supabase.from('refund_attempts').select('id,amount,currency,status,created_at,processed_at').eq('order_id',id).order('created_at',{ascending:false})
  ])

  if(!order) notFound()
  const items=(itemRows||[]) as unknown as OrderItem[]
  const payments=(paymentRows||[]) as unknown as PaymentAttempt[]
  const money=(value:number|string|null)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:order.currency||'INR'}).format(Number(value||0))
  const hasSuccessfulAttempt=payments.some(payment=>payment.status==='authorized'||payment.status==='captured')
  const hasActivePaymentSession=payments.some(payment=>['created','pending','authorized','captured','refunded'].includes(payment.status))
  const latestPayment=payments[0]
  const latestSessionExpiry=latestPayment?.provider_session_expires_at?new Date(latestPayment.provider_session_expires_at):null
  const latestSessionExpired=Boolean(latestSessionExpiry&&latestSessionExpiry.getTime()<=Date.now())
  const canRetryPayment=order.status==='pending'&&!hasSuccessfulAttempt
  const canCancelPending=order.status==='pending'&&!hasActivePaymentSession

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">ORDER {order.order_number}</span><h1>Order details.</h1><p>Placed {new Date(order.created_at).toLocaleString('en-IN')} · Current status: <strong>{order.status}</strong></p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">ITEMS & TAX SNAPSHOT</span><h2>{items.length} line item{items.length===1?'':'s'}</h2>{items.map(item=><div className="account-row" key={item.id}><div><b>{item.products?.name||'RADVORA product'}</b><span>Qty {item.quantity} · catalog unit price {money(item.unit_price)}</span>{item.hsn_code&&item.gst_rate!==null?<span>HSN {item.hsn_code} · GST {Number(item.gst_rate)}% · catalog price {item.price_includes_gst?'included GST':'excluded GST'}</span>:<span>Legacy order line · tax classification snapshot unavailable</span>}{item.line_subtotal!==null||item.tax_amount!==null?<span>Taxable value {money(item.line_subtotal)} · GST {money(item.tax_amount)}</span>:null}</div><em>{money(item.line_total)}</em></div>)}</section>
      <section className="panel"><span className="kicker">TOTAL</span><h2>{money(order.total)}</h2><div className="account-row"><div><b>Taxable value</b></div><em>{money(order.subtotal)}</em></div><div className="account-row"><div><b>GST</b></div><em>{money(order.tax)}</em></div><div className="account-row"><div><b>Shipping</b></div><em>{money(order.shipping)}</em></div><p className="empty-state">Order-item HSN/GST values are purchase-time snapshots and do not change if the live product catalog is updated later.</p></section>
      <section className="panel"><span className="kicker">PAYMENT</span><h2>{order.payment_provider||'Payment pending'}</h2>{payments.length?payments.map(payment=><div className="account-row" key={payment.id}><div><b>{payment.provider}</b><span>{money(payment.amount)} · {new Date(payment.created_at).toLocaleString('en-IN')}</span>{payment.provider_session_expires_at?<span>Hosted payment session {new Date(payment.provider_session_expires_at).getTime()<=Date.now()?'reached its scheduled expiry':'expires'} {new Date(payment.provider_session_expires_at).toLocaleString('en-IN')}</span>:null}</div><em>{payment.status==='failed'?'not completed':payment.status}</em></div>):<p className="empty-state">No payment attempt has been recorded yet.</p>}{order.status==='pending'&&latestSessionExpiry?<p className="empty-state">{latestSessionExpired?'The latest hosted payment session reached its scheduled expiry. Retry payment to let RADVORA reconcile the provider state and create a new short-lived session only when safe.':'The active hosted payment session is short-lived. Retry payment reuses the current session while it remains valid.'}</p>:null}{canRetryPayment?<div style={{marginTop:16}}><RetryPaymentButton orderId={order.id}/></div>:null}{canCancelPending?<CancelOrderButton orderId={order.id}/>:null}{order.status==='pending'&&hasActivePaymentSession&&!hasSuccessfulAttempt?<p className="empty-state">Cancellation first asks the payment provider to close and reconcile the active hosted session. Inventory is released only after provider cancellation or expiry is confirmed.</p>:null}{order.status==='cancelled'?<p className="status-message">This unpaid order was cancelled after provider-safe reconciliation. No further payment retries are available for it.</p>:null}</section>
      {refunds?.length?<section className="panel"><span className="kicker">REFUND</span><h2>Refund status</h2>{refunds.map(refund=><div className="account-row" key={refund.id}><div><b>{money(refund.amount)}</b><span>Requested {new Date(refund.created_at).toLocaleString('en-IN')}{refund.processed_at?` · Completed ${new Date(refund.processed_at).toLocaleString('en-IN')}`:''}</span></div><em>{refund.status==='failed'?'needs review':refund.status==='submitting'?'being submitted':refund.status}</em></div>)}<p className="empty-state">Provider processing times can vary. A refund is treated as completed only after server-side provider confirmation.</p></section>:order.status==='refunded'?<section className="panel"><span className="kicker">REFUND</span><h2>Fully refunded</h2><p className="status-message">This order has been fully refunded through the payment provider.</p></section>:null}
      <section className="panel"><span className="kicker">DELIVERY</span><h2>{order.status==='delivered'?'Delivered':order.status==='shipped'?'In transit':order.status==='cancelled'?'Cancelled':order.status==='refunded'?'Refunded':'Fulfillment'}</h2>{order.shipping_line1?<p>{order.shipping_name||'Customer'}<br/>{order.shipping_line1}{order.shipping_line2?<><br/>{order.shipping_line2}</>:null}<br/>{order.shipping_city||''} {order.shipping_postal_code||''}<br/>{order.shipping_state||''} {order.shipping_country||''}{order.shipping_phone?<><br/>{order.shipping_phone}</>:null}</p>:<p className="empty-state">Your delivery address will appear here after secure checkout confirms it.</p>}{order.fulfillment_carrier&&order.tracking_number?<div className="account-row"><div><b>{order.fulfillment_carrier}</b><span>Tracking: {order.tracking_number}{order.shipped_at?` · Shipped ${new Date(order.shipped_at).toLocaleDateString('en-IN')}`:''}{order.delivered_at?` · Delivered ${new Date(order.delivered_at).toLocaleDateString('en-IN')}`:''}</span></div>{order.tracking_url?<a className="pill ghost" href={order.tracking_url} target="_blank" rel="noreferrer">Track →</a>:null}</div>:order.status==='shipped'||order.status==='delivered'?<p className="empty-state">Tracking details are not available.</p>:null}</section>
      {order.checkout_terms_accepted_at?<section className="panel"><span className="kicker">CHECKOUT RECORD</span><h2>Policies accepted</h2><p>Accepted {new Date(order.checkout_terms_accepted_at).toLocaleString('en-IN')}{order.checkout_terms_version?` · Version ${order.checkout_terms_version}`:''}.</p><div className="actions"><Link className="pill ghost" href="/terms">Terms</Link><Link className="pill ghost" href="/returns">Returns</Link><Link className="pill ghost" href="/shipping">Shipping</Link><Link className="pill ghost" href="/privacy">Privacy</Link></div></section>:null}
    </div>
    <div className="actions"><Link className="pill ghost" href="/account">← Back to account</Link><Link className="pill ghost" href="/support">Need help?</Link></div>
  </div></main>
}
