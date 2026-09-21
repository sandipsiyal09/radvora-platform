import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata:Metadata={title:'ShieldTag Products',description:'Explore the RADVORA ShieldTag system for smartphones, tablets, laptops and compact technology.',alternates:{canonical:'/products'}}

const families=[
  {index:'01',name:'ShieldTag Signature',slug:'shieldtag-signature',device:'Smartphones',format:'Compact identity badge',copy:'The everyday ShieldTag proportion for modern smartphone rear surfaces.'},
  {index:'02',name:'ShieldTag Pro',slug:'shieldtag-pro',device:'Tablets',format:'Tablet-proportioned format',copy:'A broader ShieldTag proportion designed around larger tablet surfaces.'},
  {index:'03',name:'ShieldTag Executive',slug:'shieldtag-executive',device:'Laptops',format:'Hardware-plaque expression',copy:'A restrained laptop format designed to read as part of the hardware.'},
  {index:'04',name:'ShieldTag Mini',slug:'shieldtag-mini',device:'Compact accessories',format:'Reduced-format badge',copy:'A smaller identity mark for compatible charging cases and compact technology.'}
]

export default function ProductsPage(){
  return <PublicShell><main className={ui.main} data-cinematic-page="products">
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>THE SHIELDTAG SYSTEM</span><h1>One identity.<br/><em>Four device formats.</em></h1><p>Start with the hardware—not with a generic sticker size. ShieldTag changes visual proportion across smartphones, tablets, laptops and compact accessories.</p><div className={ui.actions}><Link className={ui.primary} href="/#shieldlab">Build in ShieldLab</Link><Link className={ui.secondary} href="/compatibility">Verify a device</Link></div></div>
      <aside className={ui.heroAside}><span>PRODUCT PRINCIPLE</span><strong>Designed around the device.</strong><p>Choose the format, tune the finish and verify the exact model before relying on fit guidance.</p><ul><li><span>Formats</span><b>4</b></li><li><span>Finish directions</span><b>8</b></li><li><span>Compatibility</span><b>Model-specific</b></li></ul></aside>
    </section>
    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>CHOOSE THE FORMAT</span><h2>Phone. Tablet. Laptop.<br/><em>Compact tech.</em></h2><p>Each public format serves one clear hardware context. The exact device record remains the final source for compatibility.</p></div>
      <div className={ui.grid4}>{families.map(f=><article key={f.name} className={ui.familyCard}><span>{f.index} · {f.device.toUpperCase()}</span><div className={ui.familyIcon}><b>{f.name.replace('ShieldTag ','')}</b></div><h3>{f.name}</h3><p>{f.copy}</p><footer><b>{f.format}</b><small>Preview it in ShieldLab, then verify the exact model.</small><Link className={ui.secondary} href={'/products/'+f.slug}>Explore format →</Link></footer></article>)}</div>
    </section>
    <section className={ui.section}><div className={ui.grid3}>
      <article className={ui.panel}><span className={ui.kicker}>BUILD</span><h3>Create the look.</h3><p>Choose a real device context and one of eight finish directions. Save or share the exact build.</p><div className={ui.actions}><Link className={ui.secondary} href="/#shieldlab">Open ShieldLab →</Link></div></article>
      <article className={ui.panel}><span className={ui.kicker}>VERIFY</span><h3>Confirm the exact model.</h3><p>Visual styling does not silently become compatibility. Use the reviewed device checker before relying on fit guidance.</p><div className={ui.actions}><Link className={ui.secondary} href="/compatibility">Compatibility →</Link></div></article>
      <article className={ui.panel}><span className={ui.kicker}>BUY</span><h3>Commerce appears only when real.</h3><p>Public price, stock and checkout remain hidden until approved India commerce data is configured.</p><div className={ui.actions}><Link className={ui.secondary} href="/products/shieldtag-pro">See product status →</Link></div></article>
    </div></section>
    <div className={ui.notice}>Manufacturer names and device examples are used for styling context and compatibility workflow only. They do not imply partnership, certification or endorsement.</div>
  </main></PublicShell>
}
