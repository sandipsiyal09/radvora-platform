import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata={title:'Support',description:'Get RADVORA ShieldTag support for compatibility, installation, verification, warranty and registered-product questions.',alternates:{canonical:'/support'}}

const faqs=[
  ['Which ShieldTag family should I choose?','Start with device class: Signature for smartphones, Pro for tablets, Executive for laptops and Mini for compact accessories. Exact model fit still requires compatibility confirmation.'],
  ['Why can I see a device in ShieldLab but not a compatibility result?','ShieldLab demonstrates styling and finish direction. Compatibility is a separate evidence-controlled record, so an unreviewed model remains “not yet reviewed.”'],
  ['How should ShieldTag be positioned?','Use a clean approved surface and keep clear of cameras, flash, buttons, ports, vents, hinges, charging contacts and other functional hardware unless model-specific guidance says otherwise.'],
  ['Can I match ShieldTag to my device colour?','The design system includes eight finish directions. Visual previews can show a close match or deliberate contrast; the sellable finish catalogue appears only after final approval.'],
  ['Is ShieldTag waterproof or scratch-proof?','No specific water-resistance, scratch-resistance or similar durability rating is published until the final production product has completed the required validation.'],
  ['Can I remove and reapply ShieldTag?','Removal, residue and reapplication characteristics depend on the validated production adhesive and will be published with the final care specification rather than assumed.']
]

export default function SupportPage(){
  return <PublicShell><main className={ui.main} data-cinematic-page="support">
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>SUPPORT</span><h1>Answers around<br/><em>the device journey.</em></h1><p>Start with the product family, confirm the exact device, follow the installation guidance and keep product verification or warranty records connected to your RADVORA account when those services apply.</p></div><aside className={ui.heroAside}><span>QUICK PATH</span><strong>Match → Check → Apply.</strong><ul><li><span>Visual build</span><b>ShieldLab</b></li><li><span>Exact fit</span><b>Compatibility checker</b></li><li><span>Application</span><b>Five-step guide</b></li></ul></aside></section>
    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>COMMON QUESTIONS</span><h2>Clarity before<br/><em>application.</em></h2></div><div className={ui.faqGrid}>{faqs.map(([q,a])=><article className={ui.faqItem} key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
    <section className={ui.section}><div className={ui.supportGrid}><article className={ui.supportCard}><span>DEVICE FIT</span><h3>Compatibility</h3><p>Check an exact manufacturer and model against published RADVORA compatibility records.</p><Link className={ui.secondary} href="/compatibility">Open checker →</Link></article><article className={ui.supportCard}><span>APPLICATION</span><h3>Installation</h3><p>Follow the Clean → Peel → Align → Press → Ready sequence and keep functional zones clear.</p><Link className={ui.secondary} href="/installation">View guide →</Link></article><article className={ui.supportCard}><span>AUTHENTICITY</span><h3>Verification</h3><p>Use the verification flow for supported serialized or QR-linked RADVORA product records.</p><Link className={ui.secondary} href="/verify">Verify product →</Link></article></div></section>
  </main></PublicShell>
}
