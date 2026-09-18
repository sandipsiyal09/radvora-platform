import Link from 'next/link'
import type { ReactNode } from 'react'
import ui from './public-brand.module.css'

function Mark(){return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>}

export function PublicShell({children}:{children:ReactNode}){
  return <div className={ui.page}>
    <header className={ui.nav}>
      <Link href="/" className={ui.brand} aria-label="RADVORA home"><Mark/><span><b>RADVORA</b><small>SHIELDTAG</small></span></Link>
      <nav aria-label="Primary"><Link href="/products">Products</Link><Link href="/#shieldlab">ShieldLab</Link><Link href="/compatibility">Compatibility</Link><Link href="/installation">Installation</Link><Link href="/support">Support</Link></nav>
      <Link href="/#shieldlab" className={ui.cta}>Build yours</Link>
    </header>
    {children}
    <footer className={ui.footer}>
      <Link href="/" className={ui.brand} aria-label="RADVORA home"><Mark/><span><b>RADVORA</b><small>SHIELDTAG</small></span></Link>
      <nav aria-label="Footer"><Link href="/products">Products</Link><Link href="/compatibility">Compatibility</Link><Link href="/research">Research</Link><Link href="/labs">Labs</Link><Link href="/verify">Verify</Link><Link href="/warranty">Warranty</Link><Link href="/contact">Contact</Link><Link href="/business">Business</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav>
      <p>Device examples explain styling and compatibility workflow only. No manufacturer affiliation or endorsement is implied.</p>
    </footer>
  </div>
}
