import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import CheckoutButton from './checkout-button'
import './cart.css'

export const dynamic='force-dynamic'

export default async function CartPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><p className="kicker">RADVORA CART</p><h1>Sign in to continue.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>}

  const {data:cart}=await supabase.from('carts').select('id,status').eq('user_id',user.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle()
  let items:any[]=[]
  if(cart?.id){
    const {data}=await supabase.from('cart_items').select('id,quantity,unit_price,product_id,products(name,slug,sku,price_inr,currency,status)').eq('cart_id',cart.id).order('created_at')
    items=data||[]
  }
  const subtotal=items.reduce((sum,item)=>sum+(Number(item.products?.price_inr||0)*Number(item.quantity||0)),0)
  const canCheckout=items.length>0 && items.every(item=>item.products?.status==='active' && Number(item.products?.price_inr)>0)

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA COMMERCE</span><h1>Your cart.</h1><p>Pricing is always resolved from the live product catalog at checkout. Browser-supplied totals are ignored.</p></section>
    <div className="cart-layout">
      <section className="panel"><h2>Items</h2>{items.length?items.map(item=><div className="cart-row" key={item.id}><div><b>{item.products?.name||'Product'}</b><span>{item.products?.sku||item.product_id}</span></div><div><span>Qty {item.quantity}</span><b>{item.products?.price_inr?new Intl.NumberFormat('en-IN',{style:'currency',currency:item.products.currency||'INR'}).format(Number(item.products.price_inr)*item.quantity):'Price pending'}</b></div></div>):<p className="empty-state">Your cart is empty.</p>}</section>
      <aside className="panel cart-summary"><span className="kicker">ORDER SUMMARY</span><div className="summary-line"><span>Subtotal</span><b>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(subtotal)}</b></div><div className="summary-line"><span>Tax</span><b>Calculated later</b></div><div className="summary-line"><span>Shipping</span><b>Calculated later</b></div><p className="empty-state">Creating an order does not mark it paid. Payment status changes only after a verified payment-provider flow is added.</p><CheckoutButton disabled={!canCheckout}/><div className="actions"><Link className="pill ghost" href="/products/shieldtag-pro">Continue shopping</Link></div></aside>
    </div>
  </div></main>
}
