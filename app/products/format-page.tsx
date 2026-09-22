import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'
import ProductInterestForm from '../product-interest-form'
import ProductStructuredData from '../product-structured-data'

type Props={
  label:string
  device:string
  headline:string
  accent:string
  intro:string
  proportion:string
  placement:string
  finish:string
  slug:string
}

export default function ShieldTagFormatPage({label,device,headline,accent,intro,proportion,placement,finish,slug}:Props){
  return <><ProductStructuredData name={label} slug={slug} deviceClass={device} description={intro}/><PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>{label.toUpperCase()} / {device.toUpperCase()}</span><h1>{headline}<br/><em>{accent}</em></h1><p>{intro}</p><div className={ui.actions}><Link className={ui.primary} href="/#shieldlab">Preview in ShieldLab</Link><Link className={ui.secondary} href="/compatibility">Check exact compatibility</Link></div></div>
      <aside className={ui.heroAside}><span>SHIELDTAG FORMAT</span><strong>{label}</strong><p>Choose the visual direction in ShieldLab, then confirm the exact manufacturer and model before relying on fit guidance.</p><ul><li><span>Device class</span><b>{device}</b></li><li><span>Finish directions</span><b>8</b></li><li><span>Compatibility</span><b>Model-specific</b></li></ul></aside>
    </section>
    <section className={ui.section}><div className={ui.grid3}>
      <article className={ui.panel}><span className={ui.kicker}>PROPORTION</span><h3>Designed for the surface.</h3><p>{proportion}</p></article>
      <article className={ui.panel}><span className={ui.kicker}>PLACEMENT</span><h3>Respect the hardware.</h3><p>{placement}</p></article>
      <article className={ui.panel}><span className={ui.kicker}>FINISH</span><h3>Blend in or stand apart.</h3><p>{finish}</p></article>
    </div></section>
    <section className={ui.section}><div className={ui.grid2}>
      <article className={ui.compatPanel}><span className={ui.kicker}>AVAILABILITY</span><h3>Commercial status stays live-data controlled.</h3><p>Public pricing, stock and checkout appear only when approved India commerce data for this format is configured.</p><div className={ui.actions}><Link className={ui.secondary} href="/products">Product status →</Link></div><ProductInterestForm context={`${label} · ${device}`} compact/></article>
      <article className={ui.compatPanel}><span className={ui.kicker}>BEFORE YOU APPLY</span><h3>Verify the exact device.</h3><p>The compatibility checker carries the reviewed device into this product URL for journey continuity only. URL context is not compatibility proof; re-check the database result before relying on fit guidance.</p><div className={ui.actions}><Link className={ui.secondary} href="/compatibility">Compatibility →</Link><Link className={ui.secondary} href="/installation">Installation →</Link></div></article>
    </div></section>
  </main></PublicShell></>
}
