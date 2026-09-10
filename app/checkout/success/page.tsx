import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic='force-dynamic'

export default async function CheckoutSuccessPage({searchParams}:{searchParams:Promise<{session_id?:string}>}){
  const {session_id}=await searchParams
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()

  if(!user) return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA CHECKOUT</p><h1>Sign in to view payment status.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>

  let attempt:any=null
  if(session_id){
    const {data}=await supabase.from('payment_attempts').select('status,provider_order_id,provider_payment_id,orders(order_number,status,total,currency)').eq('provider','stripe').eq('provider_order_id',session_id).maybeSingle()
    attempt=data
  }
  const order=attempt?.orders
  const confirmed=order?.status==='paid'||attempt?.status==='captured'

  return <main className="page-wrap"><div className="shell"><section className="glass bento-card">
    <p className="kicker">RADVORA CHECKOUT</p>
    <h1>{confirmed?'Payment confirmed.':'Payment received for verification.'}</h1>
    <p>{confirmed?'Your order has been marked paid after server-side payment verification.':'Do not rely on this redirect as proof of payment. RADVORA updates the order only after the signed Stripe webhook confirms it.'}</p>
    {order?<div className="account-row"><div><b>{order.order_number}</b><span>{new Intl.NumberFormat('en-IN',{style:'currency',currency:order.currency||'INR'}).format(Number(order.total||0))}</span></div><em>{order.status}</em></div>:null}
    <div className="actions"><Link className="pill light" href="/account">View account →</Link><Link className="pill ghost" href="/">Home</Link></div>
  </section></div></main>
}
