import BusinessLeadForm from '../business/lead-form'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata={title:'Dealer Program',description:'Apply to become a RADVORA ShieldTag retail or dealer partner.'}

export default function DealerPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>DEALER PROGRAM</span><h1>Present ShieldTag<br/><em>the right way.</em></h1><p>Dealer enablement is built around premium product presentation, device-family education, authenticity and exact compatibility—not unsupported claims.</p></div><aside className={ui.heroAside}><span>PARTNER STANDARD</span><strong>Consistent customer experience.</strong><p>Customers should receive the same product-family explanation and compatibility discipline online and in-store.</p></aside></section>
    <section className={ui.section}><div className={ui.grid3}><article className={ui.supportCard}><span>PRODUCT</span><h3>Four ShieldTag formats</h3><p>Train around Signature, Pro, Executive and Mini instead of treating every device as one universal sticker.</p></article><article className={ui.supportCard}><span>AUTHENTICITY</span><h3>Verification workflow</h3><p>Supported serialized products can connect to RADVORA authentication and customer-service records.</p></article><article className={ui.supportCard}><span>ENABLEMENT</span><h3>Approved sales assets</h3><p>Use current imagery, finish guidance and claims that have been approved for publication.</p></article></div></section>
    <section className={ui.section}><BusinessLeadForm source="dealer-page" title="Apply for dealer onboarding"/></section>
  </main></PublicShell>
}
