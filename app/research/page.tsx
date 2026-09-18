import Link from 'next/link'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

export default function ResearchPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>RESEARCH & VALIDATION</span><h1>Evidence before<br/><em>product claims.</em></h1><p>RADVORA separates design intent, compatibility review, product testing and public claims. A premium visual concept does not become a technical claim until the relevant evidence has been reviewed.</p><div className={ui.actions}><Link className={ui.primary} href="/labs">View RADVORA Labs →</Link><Link className={ui.secondary} href="/products">Products</Link></div></div>
      <aside className={ui.heroAside}><span>WHY THIS EXISTS</span><strong>Keep design and evidence separate.</strong><p>ShieldTag can be visually developed before every durability or compatibility statement is validated. The site should make that distinction clear.</p></aside>
    </section>
    <section className={ui.section}><div className={ui.researchGrid}><article className={ui.researchCard}><span>01 · COMPATIBILITY</span><h3>Device-specific review.</h3><p>Model, variant, placement and hardware clearances are reviewed before a compatibility result is published.</p></article><article className={ui.researchCard}><span>02 · PRODUCT TESTING</span><h3>Test the final configuration.</h3><p>Adhesion, durability, care and any other performance properties should be tested on the production specification rather than inferred from prototypes.</p></article><article className={ui.researchCard}><span>03 · PUBLICATION</span><h3>Publish only approved facts.</h3><p>Unreviewed or unsupported claims remain internal or explicitly marked as pending validation instead of becoming customer-facing promises.</p></article></div></section>
  </main></PublicShell>
}
