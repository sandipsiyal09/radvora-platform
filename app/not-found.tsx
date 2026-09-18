import Link from 'next/link'
import { PublicShell } from './public-shell'
import ui from './public-brand.module.css'

export default function NotFound(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>404 · PAGE NOT FOUND</span><h1>This route is<br/><em>off the device.</em></h1><p>The page may have moved or no longer belongs to the current RADVORA ShieldTag journey.</p><div className={ui.actions}><Link className={ui.primary} href="/">Return home →</Link><Link className={ui.secondary} href="/products">Explore ShieldTag</Link></div></div>
      <aside className={ui.heroAside}><span>KEEP MOVING</span><strong>Find the current product path.</strong><p>Use Products, Compatibility or Support to continue with the live ShieldTag experience.</p></aside>
    </section>
  </main></PublicShell>
}
