import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AddToCartButton from '../add-to-cart-button'
import { PublicShell } from '../../public-shell'
import ui from '../../public-brand.module.css'
import ProductInterestForm from '../../product-interest-form'
import ProductStructuredData from '../../product-structured-data'

export const dynamic='force-dynamic'
export const metadata:Metadata={title:'ShieldTag Pro',description:'RADVORA ShieldTag Pro is the tablet-proportioned member of the ShieldTag device identity system.',alternates:{canonical:'/products/shieldtag-pro'}}

export default async function ShieldTagProPage(){
  const supabase=await createClient()
  const {data:product}=await supabase.from('products').select('id,name,slug,sku,status,price_inr,currency,commerce_enabled,stock_on_hand,stock_reserved').eq('slug','shieldtag-pro').eq('status','active').maybeSingle()
  if(!product)notFound()
  const availableStock=product.stock_on_hand===null?null:Math.max(0,Number(product.stock_on_hand)-Number(product.stock_reserved||0))
  const indiaPurchasable=product.commerce_enabled===true&&Boolean(product.price_inr)&&product.currency==='INR'&&availableStock!==null&&availableStock>0
  const compatibilityHref='/compatibility?category=Tablet'

  return <><ProductStructuredData name="ShieldTag Pro" slug="shieldtag-pro" deviceClass="Tablets" description="RADVORA ShieldTag Pro is the tablet-proportioned member of the ShieldTag device identity system."/><PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>SHIELDTAG PRO / TABLETS</span><h1>More surface.<br/><em>More presence.</em></h1><p>ShieldTag Pro is the tablet-proportioned format in the RADVORA system—scaled to sit visually balanced beside larger hardware.</p><div className={ui.actions}><Link className={ui.primary} href="/#shieldlab">Preview in ShieldLab</Link><Link className={ui.secondary} href={compatibilityHref}>Check exact compatibility</Link></div></div>
      <aside className={ui.heroAside}><span>PRODUCT FORMAT</span><strong>Pro · tablet proportion</strong><p>See the visual direction in ShieldLab, then confirm the exact tablet before relying on fit guidance.</p><ul><li><span>Format</span><b>Tablet</b></li><li><span>Compatibility</span><b>Model-specific</b></li><li><span>Purchase state</span><b>{indiaPurchasable?'Available':'Not enabled'}</b></li></ul></aside>
    </section>

    <section className={ui.section}><div className={ui.grid3}>
      <article className={ui.panel}><span className={ui.kicker}>PROPORTION</span><h3>Scaled for tablet surfaces.</h3><p>The Pro format uses a broader visual footprint than the smartphone format so the identity mark remains balanced on larger hardware.</p></article>
      <article className={ui.panel}><span className={ui.kicker}>PLACEMENT</span><h3>Respect the hardware.</h3><p>Keep cameras, controls, charging contacts and other functional zones clear according to approved guidance.</p></article>
      <article className={ui.panel}><span className={ui.kicker}>FINISH</span><h3>Blend in or contrast.</h3><p>Preview eight finish directions in ShieldLab before deciding which visual treatment best suits the tablet.</p></article>
    </div></section>

    <section className={ui.section}><div className={ui.grid2}>
      <article className={ui.compatPanel}><span className={ui.kicker}>AVAILABILITY</span><h3>{indiaPurchasable?'Ready to purchase':'Purchase is not enabled yet.'}</h3>{product.price_inr?<p><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency||'INR'}).format(Number(product.price_inr))}</strong></p>:<p>Public pricing will appear when the approved sellable catalog is enabled.</p>}{availableStock!==null&&<p>Recorded availability: {availableStock>0?'In stock':'Out of stock'}.</p>}{indiaPurchasable?<AddToCartButton productId={product.id}/>:<><div className={ui.notice}>India checkout remains unavailable until the required seller, tax, inventory and payment prerequisites are satisfied.</div><ProductInterestForm context="ShieldTag Pro · Tablet" compact/></>}</article>
      <article className={ui.compatPanel}><span className={ui.kicker}>BEFORE YOU APPLY</span><h3>Verify the exact tablet.</h3><p>Seeing a tablet in ShieldLab is a styling preview, not a compatibility result. Confirm the exact manufacturer and model, then follow the installation guide.</p><div className={ui.actions}><Link className={ui.secondary} href={compatibilityHref}>Compatibility →</Link><Link className={ui.secondary} href="/installation">Installation →</Link></div></article>
    </div></section>
  </main></PublicShell></>
}
