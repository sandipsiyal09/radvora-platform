import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata:Metadata={
  title:'ShieldTag Products',
  description:'Explore RADVORA ShieldTag formats for smartphones, tablets, laptops and selected technology accessories.',
  alternates:{canonical:'/products'}
}

const families=[
  {index:'01',name:'ShieldTag Signature',device:'Smartphones',format:'Compact identity badge',copy:'The everyday ShieldTag proportion for modern smartphone rear surfaces.'},
  {index:'02',name:'ShieldTag Pro',device:'Tablets',format:'Tablet-proportioned format',copy:'A broader ShieldTag proportion designed around larger tablet surfaces.'},
  {index:'03',name:'ShieldTag Executive',device:'Laptops',format:'Hardware-plaque expression',copy:'A restrained laptop format designed to read as part of the hardware.'},
  {index:'04',name:'ShieldTag Mini',device:'Compact accessories',format:'Reduced-format badge',copy:'A smaller identity mark for compatible charging cases and compact technology.'}
]

export default function ProductsPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>SHIELDTAG / PRODUCT SYSTEM</span><h1>Choose the format.<br/><em>Then make it yours.</em></h1><p>RADVORA changes the badge proportion with the device class. Start with the hardware, then move into ShieldLab to choose the finish and create a shareable build.</p><div className={ui.actions}><Link className={ui.primary} href="/#shieldlab">Open ShieldLab</Link><Link className={ui.secondary} href="/compatibility">Verify a device</Link></div></div>
      <aside className={ui.heroAside}><span>LIVE PRODUCT STATUS</span><strong>Availability is governed, not guessed.</strong><p>Public price, stock and checkout appear only when approved India commerce data is configured. Styling and compatibility remain useful before purchase opens.</p><ul><li><span>Formats</span><b>4 public directions</b></li><li><span>Finish directions</span><b>8</b></li><li><span>Compatibility</span><b>Model-specific</b></li></ul></aside>
    </section>

    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>THE SYSTEM</span><h2>Phone. Tablet. Laptop.<br/><em>Compact tech.</em></h2><p>The visible range matters: visitors should understand immediately that ShieldTag is a device identity system, not a single one-size product.</p></div>
      <div className={ui.grid5}>{families.map(f=><article key={f.name} className={ui.familyCard}><span>{f.index} · {f.device.toUpperCase()}</span><div className={ui.familyIcon}><b>{f.name.replace('ShieldTag ','')}</b></div><h3>{f.name}</h3><p>{f.copy}</p><footer><b>{f.format}</b><small>Open ShieldLab to preview finish direction before checking exact model fit.</small></footer></article>)}</div>
    </section>

    <section className={ui.section}><div className={ui.grid3}>
      <article className={ui.panel}><span className={ui.kicker}>BUILD</span><h3>Create the look.</h3><p>Pick a real device context, select a finish and save or share the exact configuration from ShieldLab.</p><div className={ui.actions}><Link className={ui.secondary} href="/#shieldlab">Open ShieldLab →</Link></div></article>
      <article className={ui.panel}><span className={ui.kicker}>VERIFY</span><h3>Confirm the model.</h3><p>Visual styling never silently turns into a compatibility result. The checker remains the source for reviewed fit status.</p><div className={ui.actions}><Link className={ui.secondary} href="/compatibility">Compatibility →</Link></div></article>
      <article className={ui.panel}><span className={ui.kicker}>AVAILABILITY</span><h3>See live commercial status.</h3><p>Price and checkout remain hidden until the governed catalog has legitimate price, stock, tax and seller configuration.</p><div className={ui.actions}><Link className={ui.secondary} href="/products/shieldtag-pro">ShieldTag Pro status →</Link></div></article>
    </div></section>

    <div className={ui.notice}>Manufacturer names and device examples are used for styling context and compatibility workflow only. They do not imply partnership, certification or endorsement.</div>
  </main></PublicShell>
}
