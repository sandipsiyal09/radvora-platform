import BusinessLeadForm from './lead-form'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata={title:'Business',description:'Corporate, retail, distribution and OEM enquiries for RADVORA ShieldTag.'}

export default function BusinessPage(){
  return <PublicShell><main className={ui.main} data-cinematic-page="business">
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>RADVORA BUSINESS</span><h1>Deploy one identity<br/><em>across more devices.</em></h1><p>For corporate programs, retail partnerships, distribution and OEM conversations around ShieldTag, device compatibility, product authentication and approved rollout materials.</p></div><aside className={ui.heroAside}><span>BUSINESS FIT</span><strong>Structured, traceable deployment.</strong><p>Business discussions can cover device mix, ShieldTag family, finish direction, volume, authentication and deployment support without overstating compatibility or performance.</p></aside></section>
    <section className={ui.section}><div className={ui.grid3}><article className={ui.supportCard}><span>CORPORATE</span><h3>Device identity programs</h3><p>Plan mixed phone, tablet, laptop and accessory deployments with device-aware formats and clear compatibility workflows.</p></article><article className={ui.supportCard}><span>CHANNEL</span><h3>Retail & distribution</h3><p>Use approved product education, visual assets, authenticity workflows and controlled compatibility guidance.</p></article><article className={ui.supportCard}><span>OEM / COLLABORATION</span><h3>Integration discussions</h3><p>Explore product, packaging and device-integration concepts subject to engineering, validation and commercial review.</p></article></div></section>
    <section className={ui.section}><BusinessLeadForm/></section>
  </main></PublicShell>
}
