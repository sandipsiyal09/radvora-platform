import BusinessLeadForm from '../business/lead-form'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata={title:'Distributor Program',description:'Apply to become a RADVORA ShieldTag distribution partner.'}

export default function DistributorPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>DISTRIBUTOR PROGRAM</span><h1>Scale the system.<br/><em>Keep the story consistent.</em></h1><p>Regional and national distribution discussions focus on the ShieldTag family, device mix, inventory traceability, partner education and controlled product communication.</p></div><aside className={ui.heroAside}><span>CHANNEL DISCIPLINE</span><strong>Scale without dilution.</strong><p>Premium positioning depends on consistent product family, finish and compatibility guidance at every channel touchpoint.</p></aside></section>
    <section className={ui.section}><div className={ui.grid3}><article className={ui.supportCard}><span>TERRITORY</span><h3>Market planning</h3><p>Qualify geography, channels, expected volume, device categories and operational readiness.</p></article><article className={ui.supportCard}><span>TRACEABILITY</span><h3>Inventory & authenticity</h3><p>Where serialization is issued, downstream product records can support authenticity and service workflows.</p></article><article className={ui.supportCard}><span>GOVERNANCE</span><h3>Approved communication</h3><p>Channel material stays aligned with current product positioning, compatibility records and validated claims.</p></article></div></section>
    <section className={ui.section}><BusinessLeadForm source="distributor-page" title="Apply for distribution partnership"/></section>
  </main></PublicShell>
}
