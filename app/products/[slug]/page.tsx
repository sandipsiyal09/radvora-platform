import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AddToCartButton from '../add-to-cart-button'
import { PublicShell } from '../../public-shell'
import ui from '../../public-brand.module.css'
import ProductInterestForm from '../../product-interest-form'

type PageProps={params:Promise<{slug:string}>}
export const dynamic='force-dynamic'

const legacyPublicSlugs=new Set(['shieldtag-core','shieldtag-elite','family-pack','safestand','rf-case'])

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const {slug}=await params
  if(legacyPublicSlugs.has(slug))return {title:'RADVORA ShieldTag Products',robots:{index:false,follow:true}}
  const supabase=await createClient()
  const {data:product}=await supabase.from('products').select('name,slug,status').eq('slug',slug).eq('status','active').maybeSingle()
  if(!product)return {title:'Product not found',robots:{index:false,follow:false}}
  return {title:product.name,description:'RADVORA product information with compatibility, availability and claims kept explicit.',alternates:{canonical:'/products/'+product.slug}}
}

export default async function ProductDetailPage({params}:PageProps){
  const {slug}=await params
  if(legacyPublicSlugs.has(slug))redirect('/products')
  const supabase=await createClient()
  const {data:product}=await supabase.from('products').select('id,name,slug,sku,status,price_inr,currency,commerce_enabled,stock_on_hand,stock_reserved').eq('slug',slug).eq('status','active').maybeSingle()
  if(!product)notFound()
  const availableStock=product.stock_on_hand===null?null:Math.max(0,Number(product.stock_on_hand)-Number(product.stock_reserved||0))
  const indiaPurchasable=product.commerce_enabled===true&&Boolean(product.price_inr)&&product.currency==='INR'&&availableStock!==null&&availableStock>0

  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>RADVORA PRODUCT RECORD</span><h1>{product.name}</h1><p>This registered product record keeps commercial availability, compatibility and validated claims separate. Use the current ShieldTag family page for the primary consumer product architecture.</p><div className={ui.actions}><Link className={ui.primary} href="/products">ShieldTag products →</Link><Link className={ui.secondary} href="/compatibility">Compatibility</Link></div></div><aside className={ui.heroAside}><span>STATUS</span><strong>{indiaPurchasable?'Commerce enabled':'Commerce not enabled'}</strong><p>Checkout is available only when the required seller, tax, price, inventory and payment controls are satisfied.</p></aside></section>
    <section className={ui.section}><div className={ui.grid2}><article className={ui.compatPanel}><span className={ui.kicker}>PRODUCT INFORMATION</span><h3>{product.name}</h3>{product.sku&&<p><strong>SKU:</strong> {product.sku}</p>}{product.price_inr?<p><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency||'INR'}).format(Number(product.price_inr))}</strong></p>:<p>Public pricing is not approved for this record.</p>}{availableStock!==null&&<p>Recorded availability: {availableStock>0?'In stock':'Out of stock'}.</p>}{indiaPurchasable?<AddToCartButton productId={product.id}/>:<><div className={ui.notice}>India consumer purchasing is not enabled for this record.</div><ProductInterestForm context={product.name} compact/></>}</article><article className={ui.compatPanel}><span className={ui.kicker}>VERIFY BEFORE RELYING</span><h3>Fit and claims stay explicit.</h3><p>Visual styling does not establish compatibility or product performance. Check the exact device record and rely only on published validated specifications.</p><div className={ui.actions}><Link className={ui.secondary} href="/verify">Verify product →</Link><Link className={ui.secondary} href="/compatibility">Check device →</Link></div></article></div></section>
  </main></PublicShell>
}
