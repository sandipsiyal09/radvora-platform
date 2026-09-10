import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProductsPage(){
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id,name,slug,short_description,price_inr,currency,status')
    .eq('status','active')
    .order('name')

  return <main className="page-wrap"><div className="shell">
    <section className="page-head">
      <span className="kicker">RADVORA PRODUCTS</span>
      <h1>Technology you can verify.</h1>
      <p>Explore RADVORA products built around serialized authenticity, compatibility guidance and evidence-linked claims. Numerical RF-performance claims are published only after approved supporting evidence exists.</p>
    </section>
    <section className="admin-grid">
      {(products ?? []).map(product => <article className="panel" key={product.id}>
        <span className="kicker">ACTIVE PRODUCT</span>
        <h2>{product.name}</h2>
        <p>{product.short_description || 'RADVORA technology product with evidence-linked product information.'}</p>
        {product.price_inr ? <p><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency || 'INR'}).format(Number(product.price_inr))}</strong></p> : <p className="empty-state">Commercial pricing will be shown when approved.</p>}
        <div className="actions"><Link className="pill light" href={`/products/${product.slug}`}>View product →</Link><Link className="pill ghost" href="/compatibility">Check compatibility</Link></div>
      </article>)}
    </section>
  </div></main>
}
