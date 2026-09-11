import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import CheckoutButton from './checkout-button'
import CartItemControls from './cart-item-controls'
import './cart.css'

export const dynamic='force-dynamic'

type Product={name:string;slug:string;sku:string;price_inr:number|null;currency:string;status:string;commerce_enabled:boolean;hsn_code:string|null;gst_rate:number|null;price_inr_includes_gst:boolean|null;stock_on_hand:number|null;stock_reserved:number}
type CartItem={id:string;quantity:number;unit_price:number;product_id:string;products:Product|null}

function round2(value:number){return Math.round((value+Number.EPSILON)*100)/100}

export default async function CartPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){return <main className="page-wrap"><div className="shell"><section className="panel"><p className="kicker">RADVORA CART</p><h1>Sign in to continue.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>}

  const {data:cart}=await supabase.from('carts').select('id,status').eq('user_id',user.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle()
  let items:CartItem[]=[]
  if(cart?.id){
    const {data}=await supabase.from('cart_items').select('id,quantity,unit_price,product_id,products(name,slug,sku,price_inr,currency,status,commerce_enabled,hsn_code,gst_rate,price_inr_includes_gst,stock_on_hand,stock_reserved)').eq('cart_id',cart.id).order('created_at')
    items=(data||[]) as unknown as CartItem[]
  }

  const estimates=items.map(item=>{
    const p=item.products
    const quantity=Number(item.quantity||0)
    const price=Number(p?.price_inr||0)
    const rate=Number(p?.gst_rate||0)
    const taxConfigured=Boolean(p?.hsn_code&&p?.gst_rate!==null&&p?.price_inr_includes_gst!==null)
    if(!p||!taxConfigured||price<=0||quantity<=0)return {net:0,tax:0,gross:0}
    const raw=price*quantity
    const net=p.price_inr_includes_gst?raw/(1+rate/100):raw
    const tax=p.price_inr_includes_gst?raw-net:raw*(rate/100)
    return {net:round2(net),tax:round2(tax),gross:round2(net)+round2(tax)}
  })
  const subtotal=round2(estimates.reduce((sum,row)=>sum+row.net,0))
  const tax=round2(estimates.reduce((sum,row)=>sum+row.tax,0))
  const total=round2(subtotal+tax)
  const hasRequiredStock=(item:CartItem)=>item.products?.stock_on_hand!==null&&Number(item.products?.stock_on_hand)-Number(item.products?.stock_reserved||0)>=Number(item.quantity||0)
  const canCheckout=items.length>0&&items.every(item=>item.products?.status==='active'&&item.products?.commerce_enabled===true&&item.products?.currency==='INR'&&Number(item.products?.price_inr)>0&&Boolean(item.products?.hsn_code)&&item.products?.gst_rate!==null&&item.products?.price_inr_includes_gst!==null&&hasRequiredStock(item))
  const gatewayReady=Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)
  const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value)

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA INDIA COMMERCE</span><h1>Your cart.</h1><p>RADVORA is currently available to consumers in India only. Pricing, applicable GST and stock availability are resolved from the live governed catalog; browser-supplied totals are ignored.</p></section>
    <div className="cart-layout">
      <section className="panel"><h2>Items</h2>{items.length?items.map((item,index)=>{const product=item.products;const estimate=estimates[index];const available=product?.stock_on_hand===null||product?.stock_on_hand===undefined?null:Math.max(0,Number(product.stock_on_hand)-Number(product.stock_reserved||0));return <div className="cart-row" key={item.id}><div><b>{product?.name||'Product'}</b><span>{product?.sku||item.product_id}</span>{product?.commerce_enabled!==true?<span>Currently unavailable for checkout</span>:null}{product?.gst_rate!==null&&product?.hsn_code?<span>HSN {product.hsn_code} · GST {Number(product.gst_rate)}% · price {product.price_inr_includes_gst?'includes':'excludes'} GST</span>:<span>India tax configuration pending</span>}<span>{available===null?'Stock pending':available>=item.quantity?`${available} available`:`Only ${available} available — reduce quantity`}</span><CartItemControls itemId={item.id} quantity={Number(item.quantity)}/></div><div><span>Qty {item.quantity}</span><b>{estimate.gross>0?money(estimate.gross):'Price pending'}</b></div></div>}):<p className="empty-state">Your cart is empty.</p>}</section>
      <aside className="panel cart-summary"><span className="kicker">INDIA ORDER SUMMARY</span><div className="summary-line"><span>Taxable value</span><b>{money(subtotal)}</b></div><div className="summary-line"><span>GST</span><b>{money(tax)}</b></div><div className="summary-line"><span>Estimated total</span><b>{money(total)}</b></div><div className="summary-line"><span>Currency</span><b>INR</b></div><div className="summary-line"><span>Delivery</span><b>India only</b></div><p className="empty-state">The server recalculates tax and atomically reserves governed stock when the order is created. Shipping is currently ₹0 unless a future governed fulfilment rule explicitly changes it.</p>{items.length>0&&!canCheckout?<p className="status-message">Checkout remains blocked until every item is active, commerce-enabled, positively priced in INR, tax-configured and has enough available stock for the requested quantity.</p>:null}<CheckoutButton disabled={!canCheckout} gatewayReady={gatewayReady}/><div className="actions"><Link className="pill ghost" href="/products/shieldtag-pro">Continue shopping</Link></div></aside>
    </div>
  </div></main>
}
