import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AddToCartButton from '../add-to-cart-button'

type PageProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: PageProps){
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id,name,slug,sku,short_description,description,status,price_inr,currency')
    .eq('slug',slug)
    .eq('status','active')
    .maybeSingle()

  if(!product) notFound()
  const indiaPurchasable=Boolean(product.price_inr)&&product.currency==='INR'

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA PRODUCT</span><h1>{product.name}</h1><p>{product.short_description || 'RADVORA technology product with evidence-linked product information.'}</p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">PRODUCT INFORMATION</span><h2>{product.name}</h2><p>{product.description || product.short_description || 'Detailed product information is being prepared for release.'}</p>{product.sku?<p><strong>SKU:</strong> {product.sku}</p>:null}{product.price_inr?<p><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency || 'INR'}).format(Number(product.price_inr))}</strong></p>:null}{indiaPurchasable?<AddToCartButton productId={product.id}/>:<p className="empty-state">India consumer purchasing will be enabled only after approved INR pricing is active.</p>}</section>
      <section className="panel"><span className="kicker">EVIDENCE & AUTHENTICITY</span><h2>Verify before you rely.</h2><p>RADVORA separates product availability from scientific performance claims. Numerical RF-performance claims are displayed only when approved test evidence and supporting reports exist.</p><div className="actions"><Link className="pill ghost" href="/verify">Verify product →</Link><Link className="pill ghost" href="/labs">RADVORA Labs ↗</Link><Link className="pill ghost" href="/compatibility">Compatibility</Link></div></section>
    </div>
    <p style={{marginTop:24}}><Link href="/products">← All RADVORA products</Link></p>
  </div></main>
}
