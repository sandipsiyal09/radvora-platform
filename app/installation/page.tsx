import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'
import './installation-cinematic.css'

export const metadata={title:'ShieldTag Installation',description:'Follow RADVORA ShieldTag installation guidance: Clean, Peel, Align, Press and Ready, with device functional zones kept clear.',alternates:{canonical:'/installation'}}

const steps=[
  ['01','Clean','Prepare a clean, dry, compatible surface before positioning the badge.'],
  ['02','Peel','Lift ShieldTag carefully from its backing without touching more adhesive area than necessary.'],
  ['03','Align','Position it away from cameras, vents, buttons, ports, hinges, charging contacts and other functional zones.'],
  ['04','Press','Apply even pressure across the badge so the face and edges sit flat against the approved surface.'],
  ['05','Ready','Inspect the edges and follow the product-specific care guidance supplied with the final product.']
]

export default function InstallationPage(){
  return <PublicShell><main className={ui.main} data-cinematic-page="installation">
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>INSTALLATION</span><h1>Clean. Peel. Align.<br/><em>Press. Ready.</em></h1><p>ShieldTag installation should feel simple, but placement still matters. Confirm the device/model first, then keep the badge clear of hardware that needs to remain unobstructed.</p><div className={ui.actions}><Link className={ui.primary} href="/compatibility">Check compatibility →</Link><Link className={ui.secondary} href="/#shieldlab">Preview in ShieldLab</Link></div></div><aside className={ui.heroAside}><span>PLACEMENT PRINCIPLE</span><strong>Design around the device.</strong><p>Do not cover or interfere with cameras, controls, charging surfaces or ventilation. Device examples are visual guidance—not a substitute for approved model instructions.</p></aside></section>
    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>FIVE STEPS</span><h2>Simple application.<br/><em>Deliberate placement.</em></h2></div><div className={ui.steps}>{steps.map(([n,t,p])=><article className={ui.stepCard} key={t}><span>{n}</span><h3>{t}</h3><p>{p}</p></article>)}</div></section>
    <section className={ui.section}><div className={ui.sectionHead}><span className={ui.kicker}>KEEP CLEAR</span><h2>Respect functional hardware.</h2><p>Unless an approved device-specific instruction says otherwise, keep ShieldTag away from obvious functional zones.</p></div><div className={ui.safeZones}><div>Cameras &amp; flash</div><div>Buttons &amp; controls</div><div>Ports &amp; contacts</div><div>Vents &amp; hinges</div></div><div className={ui.notice} style={{marginTop:14}}>Adhesion, removal, reapplication, water resistance and long-term durability characteristics are published only with the validated production specification.</div></section>
  </main></PublicShell>
}
