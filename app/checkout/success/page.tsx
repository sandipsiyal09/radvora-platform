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
  const confirmed=order?.status==='paid'||order?.status==='processing'||order?.status==='shipped'||order?.status==='delivered'

  return <main className="page-wrap"><div className="shell"><section className="glass bento-card">
    <p className="kicker">RADVORA INDIA CHECKOUT</p>
    <h1>{confirmed?'Payment confirmed.':'Payment status pending.'}</h1>
    <p>{confirmed?'Your order has been confirmed after server-side payment verification.':'A redirect or browser message is never treated as proof of payment. Order status changes only after the configured Indian payment gateway is verified server-side.'}</p>
    {order?<div className="account-row"><div><b>{order.order_number}</b><span>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(order.total||0))}</span></div><em>{order.status}</em></div>:null}
    <div className="actions"><Link className="pill light" href="/account">View account →</Link><Link className="pill ghost" href="/">Home</Link></div>
  </section></div></main>
}
