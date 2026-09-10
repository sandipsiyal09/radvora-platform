import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

type PageProps={params:Promise<{id:string}>}
type OrderItem={id:string;quantity:number;unit_price:number;line_total:number;products:{name:string;slug:string}|null}

export default async function OrderDetailPage({params}:PageProps){
  const {id}=await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ORDER DETAILS</span><h1>Sign in to continue.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>}

  const [{data:order},{data:itemRows},{data:payments}]=await Promise.all([
    supabase.from('orders').select('id,order_number,status,currency,subtotal,tax,shipping,total,payment_provider,payment_reference,created_at,updated_at').eq('id',id).eq('user_id',user.id).maybeSingle(),
    supabase.from('order_items').select('id,quantity,unit_price,line_total,products(name,slug)').eq('order_id',id).order('created_at'),
    supabase.from('payment_attempts').select('id,provider,amount,currency,status,failure_code,created_at').eq('order_id',id).order('created_at',{ascending:false})
  ])

  if(!order) notFound()
  const items=(itemRows||[]) as unknown as OrderItem[]
  const money=(value:number|string|null)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:order.currency||'INR'}).format(Number(value||0))

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">ORDER {order.order_number}</span><h1>Order details.</h1><p>Placed {new Date(order.created_at).toLocaleString('en-IN')} · Current status: <strong>{order.status}</strong></p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">ITEMS</span><h2>{items.length} line item{items.length===1?'':'s'}</h2>{items.map(item=><div className="account-row" key={item.id}><div><b>{item.products?.name||'RADVORA product'}</b><span>Qty {item.quantity} · {money(item.unit_price)} each</span></div><em>{money(item.line_total)}</em></div>)}</section>
      <section className="panel"><span className="kicker">TOTAL</span><h2>{money(order.total)}</h2><div className="account-row"><div><b>Subtotal</b></div><em>{money(order.subtotal)}</em></div><div className="account-row"><div><b>Tax</b></div><em>{money(order.tax)}</em></div><div className="account-row"><div><b>Shipping</b></div><em>{money(order.shipping)}</em></div></section>
      <section className="panel"><span className="kicker">PAYMENT</span><h2>{order.payment_provider||'Payment pending'}</h2>{payments?.length?payments.map(payment=><div className="account-row" key={payment.id}><div><b>{payment.provider}</b><span>{money(payment.amount)} · {new Date(payment.created_at).toLocaleString('en-IN')}{payment.failure_code?` · ${payment.failure_code}`:''}</span></div><em>{payment.status}</em></div>):<p className="empty-state">No payment attempt has been recorded yet.</p>}</section>
    </div>
    <div className="actions"><Link className="pill ghost" href="/account">← Back to account</Link><Link className="pill ghost" href="/support">Need help?</Link></div>
  </div></main>
}
