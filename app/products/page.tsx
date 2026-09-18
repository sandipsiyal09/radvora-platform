import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata:Metadata={
  title:'ShieldTag Products',
  description:'Explore the RADVORA ShieldTag family for smartphones, tablets, laptops and selected technology accessories.',
  alternates:{canonical:'/products'}
}

const families=[
  {index:'01',name:'ShieldTag Signature',device:'Smartphones',format:'Compact identity badge',copy:'Designed as the balanced everyday ShieldTag format for modern smartphone rear surfaces.'},
  {index:'02',name:'ShieldTag Pro',device:'Tablets',format:'Tablet-proportioned format',copy:'A larger ShieldTag format designed to sit proportionally on tablet backs and compatible cases.'},
  {index:'03',name:'ShieldTag Executive',device:'Laptops',format:'Plaque-style identity',copy:'A restrained laptop format designed to read like a premium hardware plaque rather than a sticker.'},
  {index:'04',name:'ShieldTag Mini',device:'Compact accessories',format:'Reduced-format badge',copy:'A smaller format for compatible charging cases and compact technology surfaces.'},
  {index:'05',name:'ShieldTag Utility',device:'Universal technology',format:'Flexible supported format',copy:'A broader format direction for approved electronics and supported asset-identification contexts.'}
]

export default function ProductsPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>THE SHIELDTAG FAMILY</span><h1>One identity system.<br/><em>Five proportions.</em></h1><p>RADVORA ShieldTag is organised around the device—not around one sticker size. Each family changes scale and visual proportion for the surface it is intended to complement.</p><div className={ui.actions}><Link className={ui.primary} href="/#matcher">Find Your Match →</Link><Link className={ui.secondary} href="/compatibility">Check compatibility</Link></div></div>
      <aside className={ui.heroAside}><span>PRODUCT PRINCIPLE</span><strong>Designed to look native.</strong><p>Every family shares the same restrained RADVORA identity while adapting its footprint to phones, tablets, laptops and compact accessories.</p><ul><li><span>Finish system</span><b>8 visual directions</b></li><li><span>Compatibility</span><b>Model-specific</b></li><li><span>Commerce</span><b>Only when approved</b></li></ul></aside>
    </section>

    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>PRODUCT ARCHITECTURE</span><h2>Choose by device.<br/><em>Then choose the finish.</em></h2><p>The family name communicates the intended device class. Exact model fit is confirmed separately so visual examples never become unsupported compatibility claims.</p></div>
      <div className={ui.grid5}>{families.map(f=><article key={f.name} className={ui.familyCard}><span>{f.index} · {f.device.toUpperCase()}</span><div className={ui.familyIcon}><b>{f.name.replace('ShieldTag ','')}</b></div><h3>{f.name}</h3><p>{f.copy}</p><footer><b>{f.format}</b><small>Commercial pricing and availability appear only when the sellable catalogue is approved.</small></footer></article>)}</div>
    </section>

    <section className={ui.section}><div className={ui.grid3}><article className={ui.panel}><span className={ui.kicker}>DEVICE-AWARE</span><h3>Proportion before decoration.</h3><p>A phone, tablet and laptop do not share the same usable surface. ShieldTag formats are separated so the badge can remain visually balanced.</p></article><article className={ui.panel}><span className={ui.kicker}>FINISH-AWARE</span><h3>Blend in or contrast.</h3><p>Obsidian, titanium, graphite, arctic, midnight, rose, forest and champagne directions let customers preview a close match or deliberate contrast.</p></article><article className={ui.panel}><span className={ui.kicker}>EVIDENCE-AWARE</span><h3>Claims stay controlled.</h3><p>Compatibility, durability and water-resistance statements remain separate from visual styling and are published only when validated.</p></article></div></section>
    <div className={ui.notice}>Manufacturer names and device examples elsewhere on the site are shown for visual context only. They do not imply partnership, certification or endorsement.</div>
  </main></PublicShell>
}
