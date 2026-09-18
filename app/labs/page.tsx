import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export const metadata={title:'RADVORA Labs',description:'Explore RADVORA ShieldTag validation methods for compatibility, materials, product care and evidence-controlled claims.',alternates:{canonical:'/labs'}}

const cards=[
  {n:'01',title:'Compatibility methodology',body:'Record the exact device, model family, variant, ShieldTag format and approved placement so compatibility is never generalized beyond the reviewed configuration.'},
  {n:'02',title:'Materials & care validation',body:'Publish adhesion, removal, reapplication, water-resistance or durability statements only after the final production materials and construction have been tested.'},
  {n:'03',title:'Claims governance',body:'Marketing statements stay linked to approved evidence. A visual mockup, prototype or supplier specification is not treated as a validated RADVORA product claim.'},
  {n:'04',title:'Public transparency',body:'Where appropriate, publish approved summaries, status and care guidance without inventing certifications, ratings or technical outcomes.'}
]

export default function LabsPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>RADVORA LABS</span><h1>Validation made<br/><em>inspectable.</em></h1><p>RADVORA Labs is the evidence layer behind compatibility, product-care guidance and any future validated performance statements. The public site should show what has been reviewed—and leave everything else explicitly pending.</p><div className={ui.actions}><Link className={ui.primary} href="/compatibility">Check compatibility →</Link><Link className={ui.secondary} href="/verify">Verify product</Link></div></div>
      <aside className={ui.heroAside}><span>CURRENT PUBLIC STATUS</span><strong>No unsupported performance rating published.</strong><p>This is intentional. Product presentation can move forward while evidence-gated claims remain unavailable until reviewed.</p></aside>
    </section>
    <section className={ui.section}><div className={ui.researchGrid}>{cards.map(card=><article className={ui.researchCard} key={card.title}><span>{card.n}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div><div className={ui.reportState}><b>Validation status</b><p>No final water-resistance, scratch-resistance, residue-free, reusable or lifetime-adhesion rating is presented unless the production product has completed the required validation.</p></div></section>
  </main></PublicShell>
}
