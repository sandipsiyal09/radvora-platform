import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AddToCartButton from '../add-to-cart-button'
import { PublicShell } from '../../public-shell'
import ui from '../../public-brand.module.css'

export const dynamic='force-dynamic'

export const metadata:Metadata={
  title:'ShieldTag Pro',
  description:'RADVORA ShieldTag Pro is the tablet-proportioned member of the ShieldTag device identity family.',
  alternates:{canonical:'/products/shieldtag-pro'}
}

export default async function ShieldTagProPage(){
  const supabase=await createClient()
  const {data:product}=await supabase.from('products').select('id,name,slug,sku,status,price_inr,currency,commerce_enabled,stock_on_hand,stock_reserved').eq('slug','shieldtag-pro').eq('status','active').maybeSingle()
  if(!product)notFound()
  const availableStock=product.stock_on_hand===null?null:Math.max(0,Number(product.stock_on_hand)-Number(product.stock_reserved||0))
  const indiaPurchasable=product.commerce_enabled===true&&Boolean(product.price_inr)&&product.currency==='INR'&&availableStock!==null&&availableStock>0

  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>SHIELDTAG PRO</span><h1>Proportioned<br/><em>for tablets.</em></h1><p>ShieldTag Pro is the larger-format member of the RADVORA identity system, designed to look visually balanced on approved tablet backs and compatible cases.</p><div className={ui.actions}><Link className={ui.primary} href="/#matcher">Preview on a tablet →</Link><Link className={ui.secondary} href="/compatibility">Check exact compatibility</Link></div></div>
      <aside className={ui.heroAside}><span>PRODUCT FAMILY</span><strong>Tablet · Pro format</strong><p>Visual examples can show colour and placement direction. Exact model fit remains separately verified.</p><ul><li><span>Authentication</span><b>Serialized where issued</b></li><li><span>Compatibility</span><b>Model-specific</b></li><li><span>Claims</span><b>Evidence-controlled</b></li></ul></aside>
    </section>

    <section className={ui.section}><div className={ui.grid3}><article className={ui.panel}><span className={ui.kicker}>PROPORTION</span><h3>Made larger for tablet surfaces.</h3><p>The Pro format is visually scaled for tablet backs rather than reusing the smaller smartphone badge unchanged.</p></article><article className={ui.panel}><span className={ui.kicker}>PLACEMENT</span><h3>Keep functional zones clear.</h3><p>Approved placement should avoid cameras, buttons, charging contacts and other hardware that needs to remain unobstructed.</p></article><article className={ui.panel}><span className={ui.kicker}>FINISH</span><h3>Match or contrast.</h3><p>Use the finish studio to preview a close device match or a deliberately contrasting ShieldTag direction.</p></article></div></section>

    <section className={ui.section}><div className={ui.grid2}><article className={ui.compatPanel}><span className={ui.kicker}>COMMERCIAL STATUS</span><h3>{indiaPurchasable?'Available for purchase':'Purchasing is not enabled yet.'}</h3>{product.price_inr?<p><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency||'INR'}).format(Number(product.price_inr))}</strong></p>:<p>Final public pricing will appear only when the approved sellable catalogue is enabled.</p>}{availableStock!==null&&<p>Recorded availability: {availableStock>0?'In stock':'Out of stock'}.</p>}{indiaPurchasable?<AddToCartButton productId={product.id}/>:<div className={ui.notice}>India checkout remains unavailable until all required commerce, seller, tax, inventory and payment prerequisites are satisfied.</div>}</article><article className={ui.compatPanel}><span className={ui.kicker}>BEFORE YOU APPLY</span><h3>Confirm the exact tablet.</h3><p>Seeing a tablet in the visual matcher is not a compatibility result. Use the checker for the manufacturer and exact model, then follow the approved installation guidance.</p><div className={ui.actions}><Link className={ui.secondary} href="/compatibility">Compatibility →</Link><Link className={ui.secondary} href="/installation">Installation →</Link></div></article></div></section>
  </main></PublicShell>
}
