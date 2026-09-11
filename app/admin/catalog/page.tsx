import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import ProductEditor from './product-editor'

export const dynamic='force-dynamic'

export default async function CatalogAdminPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA ADMIN</p><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>
  const role=user.app_metadata?.role
  if(role!=='admin'&&role!=='founder')return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">ACCESS CONTROL</p><h1>Founder/admin access required.</h1></section></div></main>
  const {data:products}=await supabase.from('products').select('id,name,slug,sku,short_description,description,status,price_inr,currency,commerce_enabled,updated_at').order('updated_at',{ascending:false})
  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA CATALOG · INTERNAL</span><h1>Product control.</h1><p>Pricing, descriptions, publication state and India commerce activation are controlled here. Scientific or health claims do not belong in product copy unless separately approved through Labs. Commerce remains disabled until an admin explicitly enables a product after active INR pricing is set.</p></section>
    <div className="admin-grid">{products?.length?products.map(p=><section className="panel" key={p.id}><div className="admin-row"><div><b>{p.name}</b><span>{p.sku} · /{p.slug}</span></div><em>{p.commerce_enabled?'commerce on':p.status}</em></div><ProductEditor product={{...p,price_inr:p.price_inr===null?null:Number(p.price_inr)}}/></section>):<section className="panel"><p className="empty-state">No products found.</p></section>}</div>
  </div></main>
}
