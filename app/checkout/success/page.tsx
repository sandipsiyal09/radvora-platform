import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic='force-dynamic'

export default async function CheckoutSuccessPage({searchParams}:{searchParams:Promise<{order_id?:string}>}){
  const {order_id}=await searchParams
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()

  if(!user) return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA CHECKOUT</p><h1>Sign in to view payment status.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>

  let order:any=null
  if(order_id){
    const {data}=await supabase.from('orders').select('id,order_number,status,total,currency').eq('id',order_id).eq('user_id',user.id).maybeSingle()
    order=data
  }

  const status=String(order?.status||'pending')
  const confirmed=['paid','processing','shipped','delivered'].includes(status)
  const refunded=status==='refunded'
  const cancelled=status==='cancelled'
  const heading=confirmed?'Payment confirmed.':refunded?'Order refunded.':cancelled?'Order cancelled.':'Payment status pending.'
  const message=confirmed
    ? 'Your order has been confirmed after server-side payment verification.'
    : refunded
      ? 'The order has been fully refunded through the payment provider. Your account order record contains the latest status.'
      : cancelled
        ? 'This unpaid order has been cancelled and can no longer accept payment retries.'
        : 'A redirect or browser message is never treated as proof of payment. Order status changes only after the configured Indian payment gateway is verified server-side.'

  return <main className="page-wrap"><div className="shell"><section className="glass bento-card">
    <p className="kicker">RADVORA INDIA CHECKOUT</p>
    <h1>{heading}</h1>
    <p>{message}</p>
    {order?<div className="account-row"><div><b>{order.order_number}</b><span>{new Intl.NumberFormat('en-IN',{style:'currency',currency:order.currency||'INR'}).format(Number(order.total||0))}</span></div><em>{order.status}</em></div>:<p className="empty-state">No matching order was found in your account.</p>}
    <div className="actions"><Link className="pill light" href="/account">View account →</Link><Link className="pill ghost" href="/">Home</Link></div>
  </section></div></main>
}
