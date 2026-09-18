import Link from 'next/link'
import ui from './public-brand.module.css'

function Mark(){return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>}

export function PublicShell({children}:{children:React.ReactNode}){
  return <div className={ui.page}>
    <header className={ui.nav}>
      <Link href="/" className={ui.brand}><Mark/><span><b>RADVORA</b><small>SHIELDTAG</small></span></Link>
      <nav><Link href="/products">Products</Link><Link href="/compatibility">Compatibility</Link><Link href="/installation">Installation</Link><Link href="/about">About</Link><Link href="/support">Support</Link></nav>
      <Link href="/#matcher" className={ui.cta}>Find Your Match <span>→</span></Link>
    </header>
    {children}
    <footer className={ui.footer}>
      <Link href="/" className={ui.brand}><Mark/><span><b>RADVORA</b><small>ONE SHIELD. EVERY DEVICE.</small></span></Link>
      <div><Link href="/products">Products</Link><Link href="/compatibility">Compatibility</Link><Link href="/support">Support</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
      <p>Device examples and manufacturer names are used to explain styling context and compatibility workflow. No manufacturer affiliation or endorsement is implied.</p>
    </footer>
  </div>
}
