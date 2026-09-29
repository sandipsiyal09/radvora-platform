import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'
import './warranty-cinematic.css'

export const metadata={title:'Warranty',description:'Review RADVORA warranty guidance, product verification and service pathways for registered ShieldTag products.',alternates:{canonical:'/warranty'}}

export default function WarrantyPage(){
  return <PublicShell><main className={ui.main} data-cinematic-page="warranty">
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>WARRANTY</span><h1>Service tied to<br/><em>the product record.</em></h1><p>Where warranty coverage applies, product identity, proof of purchase, registration and service history can be reviewed together instead of handled as disconnected messages.</p></div><aside className={ui.heroAside}><span>BEFORE A CLAIM</span><strong>Verify. Register. Document.</strong><p>Eligibility and remedies depend on the applicable product terms and the facts of the request.</p></aside></section>
    <section className={ui.section}><div className={ui.grid2}><article className={ui.compatPanel}><span className={ui.kicker}>PREPARE</span><h3>Keep the product record ready.</h3><p>Verify the product where serialization is supported, retain proof of purchase and use the customer account when product registration is available.</p><div className={ui.actions}><Link className={ui.secondary} href="/verify">Verify product →</Link></div></article><article className={ui.compatPanel}><span className={ui.kicker}>SUBMIT & TRACK</span><h3>Use the account workflow.</h3><p>Sign in to create a warranty request and follow its status. Administrative decisions remain human-reviewed and recorded.</p><div className={ui.actions}><Link className={ui.primary} href="/login">Open account →</Link><Link className={ui.secondary} href="/support">Support</Link></div></article></div></section>
  </main></PublicShell>
}
