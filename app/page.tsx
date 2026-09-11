'use client'

import { useEffect, useRef, useState } from 'react'

const products = [
  { name: 'ShieldTag Pro', meta: 'Flagship · Serialized', icon: '◉' },
  { name: 'ShieldCase', meta: 'Device-specific protection', icon: '▣' },
  { name: 'ShieldCard', meta: 'Portable RF accessory', icon: '◇' },
  { name: 'HomeSphere', meta: 'Connected-space concept', icon: '●' },
  { name: 'SafeStand', meta: 'Distance-first design', icon: '⌁' },
]

const nav = [
  { label: 'Products', href: '/products' },
  { label: 'Science', href: '/research' },
  { label: 'Labs', href: '/labs' },
  { label: 'Business', href: '/business' },
  { label: 'About', href: '/about' },
]

function ShieldTag3D() {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const rotation = useRef({ x: -12, y: -24 })

  const apply = () => {
    if (ref.current) {
      ref.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
    }
  }

  useEffect(() => apply(), [])

  return (
    <div className="stage" onPointerMove={(e) => {
      if (!dragging) return
      rotation.current.y += e.movementX * .35
      rotation.current.x -= e.movementY * .2
      rotation.current.x = Math.max(-32, Math.min(28, rotation.current.x))
      apply()
    }} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)}>
      <div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit orbit-c" />
      <div className="product-shadow" />
      <div ref={ref} className="shieldtag" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true) }}>
        <div className="shieldtag-face">
          <div className="brandmark">A</div>
          <b>RADVORA</b><span>SHIELDTAG PRO</span>
        </div>
        <div className="shieldtag-edge" />
      </div>
      <div className="drag-hint">↔ Drag to rotate</div>
    </div>
  )
}

function MiniWave() {
  return <svg className="wave" viewBox="0 0 520 170" aria-label="illustrative RF waveform">
    <defs><linearGradient id="wg" x1="0" x2="1"><stop offset="0" stopColor="#4c8cff" stopOpacity=".15"/><stop offset=".5" stopColor="#7ddcff"/><stop offset="1" stopColor="#7ee7ff" stopOpacity=".15"/></linearGradient></defs>
    {[0,1,2,3,4].map(i => <path key={i} d={`M0 ${88+i*3} C65 ${12+i*8}, 96 ${158-i*4}, 157 ${88+i*2} S260 ${12+i*9}, 318 ${88-i*2} S422 ${150-i*8}, 520 ${88+i}`} fill="none" stroke="url(#wg)" strokeWidth="1.4" opacity={.35+i*.12}/>)}
  </svg>
}

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [activeProduct, setActiveProduct] = useState(0)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--my', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return <>
    <div className="cursor-glow" />
    <header className="nav"><div className="shell nav-inner">
      <a className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></a>
      <nav className={`links ${menu ? 'open' : ''}`}>{nav.map(item => <a key={item.label} onClick={() => setMenu(false)} href={item.href}>{item.label}</a>)}</nav>
      <div className="nav-actions"><a className="icon-btn" aria-label="Verify a product" href="/verify">✓</a><a className="pill light" href="/products">Shop products</a><button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button></div>
    </div></header>

    <main id="top">
      <section className="hero shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="kicker">ENGINEERED · TESTED · TRANSPARENT</div>
            <h1>Technology<br/><span>you can measure.</span></h1>
            <p>RF-focused smartphone accessories and digital-wellness technology designed around measurable engineering, transparent testing and premium everyday experience.</p>
            <div className="actions"><a className="pill light" href="/products">Explore products <span>→</span></a><a className="pill ghost" href="/research">See our approach <span>↗</span></a></div>
            <div className="trust-row"><div><b>01</b><span>Measured first</span></div><div><b>02</b><span>Claims reviewed</span></div><div><b>03</b><span>Built for daily life</span></div></div>
          </div>
          <div className="hero-product"><ShieldTag3D /></div>
          <aside className="hero-side glass"><span className="badge">NEW CONCEPT</span><h2>ShieldTag Pro</h2><p>Premium material design, serialized authentication and test-linked product claims.</p><div className="divider"/><div className="metric-row"><span>Evidence status</span><b>Pre-test</b></div><div className="metric-row"><span>Product phase</span><b>Prototype</b></div><MiniWave/><a href="/labs">View Radvora Labs →</a></aside>
        </div>
      </section>

      <section id="products" className="ecosystem shell glass">
        <div className="section-intro"><div><span className="kicker">THE RADVORA ECOSYSTEM</span><h2>One visual language.<br/>A complete product world.</h2></div><p>Designed as a premium technology family—not a one-product sticker brand.</p></div>
        <div className="product-strip">{products.map((p,i)=><button key={p.name} className={`product-tile ${activeProduct===i?'active':''}`} onClick={()=>setActiveProduct(i)}><span className="tile-icon">{p.icon}</span><strong>{p.name}</strong><small>{p.meta}</small></button>)}</div>
      </section>

      <section id="science" className="section shell">
        <div className="bento">
          <article className="bento-card science-card glass"><span className="kicker">THE SCIENCE</span><h2>Evidence before marketing.</h2><p>Every public performance statement is designed to connect to a specific device, test method, network condition and approved report.</p><MiniWave/><a href="/research" className="text-link">Explore methodology →</a></article>
          <article className="bento-card compatibility glass"><span className="kicker">COMPATIBILITY</span><h3>Made for your device world.</h3><div className="phone-stack"><div/><div/><div/></div><div className="logo-row"><span>APPLE</span><span>SAMSUNG</span><span>GOOGLE</span><span>+</span></div></article>
          <article id="labs" className="bento-card report-card glass"><span className="kicker">RADVORA LABS</span><h3>Lab reports.<br/>Without the hype.</h3><div className="report-sheet"><span>RADVORA</span><b>TEST REPORT</b><i>Device · Network · Method</i><div className="report-lines"/></div><p>Verified data will appear here only after approved testing.</p><a href="/labs" className="text-link">Browse approved reports →</a></article>
          <article id="business" className="bento-card business-card glass"><span className="kicker">BUSINESS</span><h3>Retail. Corporate.<br/>Distribution.</h3><p>Dealer onboarding, authenticated inventory, corporate wellness packs and channel analytics.</p><a className="pill ghost" href="/business">Partner with us →</a></article>
        </div>
      </section>

      <section className="section shell app-section" id="app">
        <div className="app-copy"><span className="kicker">RADVORA APP</span><h2>Your products, science and support—in one beautiful interface.</h2><p>Product registration, QR authenticity, compatibility guidance, lab reports and digital-wellness tools share the same cinematic design system as the website.</p><div className="feature-list"><span>◉ Product verification</span><span>◉ 3D product viewer</span><span>◉ Lab report library</span><span>◉ Warranty & support</span></div></div>
        <div className="phones">
          <div className="phone phone-back"><div className="phone-ui"><small>SCIENCE</small><h4>Transparent testing.</h4><MiniWave/><div className="mini-card">Lab reports<br/><b>Published after approval</b></div></div></div>
          <div className="phone phone-front"><div className="phone-ui"><small>RADVORA</small><h4>A calmer digital experience.</h4><div className="mini-product"><div className="mini-disc">A</div><span>ShieldTag Pro</span></div><div className="mini-grid"><div>Verify</div><div>Science</div><div>Support</div><div>Profile</div></div></div></div>
        </div>
      </section>

      <section id="about" className="manifesto"><div className="shell"><span className="kicker">RADVORA PRINCIPLE 001</span><h2>No fear marketing.<br/><span>No mystery technology.</span></h2><p>Build beautiful hardware. Test it properly. Publish what is actually measured.</p><a className="text-link" href="/about">About RADVORA →</a></div></section>

      <section id="contact" className="section shell final-cta glass"><div><span className="kicker">BUILDING RADVORA</span><h2>The next-generation consumer-tech platform starts here.</h2></div><a className="pill light" href="/contact">Business enquiries →</a></section>
    </main>

    <footer><div className="shell footer-inner"><a className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></a><p>Technology should serve humanity.</p><nav aria-label="Legal and support"><a href="/support">Support</a> · <a href="/warranty">Warranty</a> · <a href="/shipping">Shipping</a> · <a href="/returns">Returns</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></nav><span>© 2026 RADVORA Technologies</span></div></footer>
  </>
}
