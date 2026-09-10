import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ShieldTagProPage() {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id,name,slug,sku,short_description,description,status,price_inr,currency')
    .eq('slug', 'shieldtag-pro')
    .eq('status', 'active')
    .maybeSingle()

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
            <span className="visual-note">3D product system · interactive model coming next</span>
          </div>

          <div className="product-copy">
            <p className="kicker">FLAGSHIP PRODUCT</p>
            <h1>{product?.name ?? 'ShieldTag Pro'}</h1>
            <p className="product-lead">{product?.short_description ?? 'RF-focused smartphone accessory built around test-linked product claims and serialized authenticity.'}</p>

            <div className="product-status-grid">
              <div className="glass"><span>Evidence status</span><b>Pre-test</b></div>
              <div className="glass"><span>Product phase</span><b>Prototype</b></div>
              <div className="glass"><span>Authentication</span><b>Serialized</b></div>
              <div className="glass"><span>Claims model</span><b>Evidence-linked</b></div>
            </div>

            {product?.price_inr ? <p className="product-price">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR' }).format(Number(product.price_inr))}</p> : null}

            <div className="actions">
              <Link className="pill light" href="/verify">Verify a product →</Link>
              <Link className="pill ghost" href="/labs">View RADVORA Labs ↗</Link>
            </div>

            <div className="product-note glass">
              <strong>Evidence before marketing.</strong>
              <p>RADVORA will not display a numerical RF-performance claim here until a corresponding approved test record and laboratory report exist.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
