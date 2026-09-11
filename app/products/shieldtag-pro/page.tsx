import type { Metadata } from 'next'
import './product.css'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AddToCartButton from '../add-to-cart-button'

export const dynamic = 'force-dynamic'

export const metadata:Metadata={
  title:'ShieldTag Pro',
  description:'ShieldTag Pro by RADVORA Technologies with serialized authenticity and evidence-controlled product information.',
  alternates:{canonical:'/products/shieldtag-pro'},
  openGraph:{title:'ShieldTag Pro | RADVORA Technologies',description:'Flagship RADVORA product with serialized authenticity and evidence-controlled claims.',url:'/products/shieldtag-pro'}
}

export default async function ShieldTagProPage() {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id,name,slug,sku,short_description,description,status,price_inr,currency,commerce_enabled')
    .eq('slug', 'shieldtag-pro')
    .eq('status', 'active')
    .maybeSingle()

  if(!product) notFound()

  const [{count:publishedClaims},{count:publishedTests}]=await Promise.all([
    supabase.from('claims').select('*',{count:'exact',head:true}).eq('product_id',product.id).eq('status','published').neq('category','health'),
    supabase.from('rf_tests').select('*',{count:'exact',head:true}).eq('product_id',product.id).eq('status','published')
  ])
  const indiaPurchasable=product.commerce_enabled===true&&Boolean(product.price_inr)&&product.currency==='INR'

  return (
    <main className="page-wrap">
      <div className="shell">
        <section className="product-detail-grid">
          <div className="product-visual glass">
            <div className="product-orbit product-orbit-a" />
            <div className="product-orbit product-orbit-b" />
            <div className="product-disc-large">
              <span className="product-a">A</span>
              <strong>RADVORA</strong>
              <small>SHIELDTAG PRO</small>
            </div>
            <span className="visual-note">Interactive 3D product presentation</span>
          </div>

          <div className="product-copy">
            <p className="kicker">FLAGSHIP PRODUCT</p>
            <h1>{product.name}</h1>
            <p className="product-lead">{product.short_description || 'RADVORA RF-focused smartphone accessory with serialized authenticity and evidence-controlled product information.'}</p>

            <div className="product-status-grid">
              <div className="glass"><span>Published RF tests</span><b>{publishedTests ?? 0}</b></div>
              <div className="glass"><span>Published non-health claims</span><b>{publishedClaims ?? 0}</b></div>
              <div className="glass"><span>Authentication</span><b>Serialized</b></div>
              <div className="glass"><span>Claims model</span><b>Evidence-gated</b></div>
            </div>

            {product.price_inr ? <p className="product-price">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR' }).format(Number(product.price_inr))}</p> : null}
            {indiaPurchasable?<AddToCartButton productId={product.id}/>:<p className="empty-state">India consumer purchasing is not enabled for this product yet.</p>}

            <div className="actions">
              <Link className="pill ghost" href="/verify">Verify a product →</Link>
              <Link className="pill ghost" href="/labs">View RADVORA Labs ↗</Link>
            </div>

            <div className="product-note glass">
              <strong>Evidence before marketing.</strong>
              <p>Numerical RF-performance claims are shown only when the corresponding evidence has passed the required scientific and compliance review.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
