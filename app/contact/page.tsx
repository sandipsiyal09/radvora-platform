import Link from 'next/link'
import BusinessLeadForm from '../business/lead-form'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export default function ContactPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>CONTACT RADVORA</span><h1>Start with the<br/><em>right conversation.</em></h1><p>Use the business form for corporate, retail, distributor or OEM discussions. Existing customers can use Support, Compatibility, Verification or their account for product-specific needs.</p></div><aside className={ui.heroAside}><span>ROUTING</span><strong>Less friction, clearer answers.</strong><ul><li><span>Device fit</span><b>Compatibility</b></li><li><span>Application</span><b>Installation</b></li><li><span>Business</span><b>Enquiry form</b></li></ul></aside></section>
    <section className={ui.section}><div className={ui.grid2}><div><BusinessLeadForm source="contact-page" title="Contact the RADVORA team"/></div><article className={ui.compatPanel}><span className={ui.kicker}>CUSTOMER SUPPORT</span><h3>Already have a product question?</h3><p>For product fit, application, authenticity or warranty, use the dedicated path so the answer stays connected to the right record.</p><div className={ui.actions}><Link className={ui.primary} href="/support">Support →</Link><Link className={ui.secondary} href="/compatibility">Compatibility</Link><Link className={ui.secondary} href="/verify">Verify product</Link></div></article></div></section>
  </main></PublicShell>
}
