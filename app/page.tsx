'use client'

import { useEffect, useRef, useState } from 'react'

const products = [
  { name: 'ShieldTag Pro', meta: 'Flagship · Serialized', icon: '◉' },
  { name: 'ShieldTag Core', meta: 'ShieldTag product family', icon: '◇' },
  { name: 'ShieldTag Elite', meta: 'ShieldTag product family', icon: '◆' },
  { name: 'RF Case', meta: 'RF-focused accessory', icon: '▣' },
  { name: 'SafeStand', meta: 'Distance-first design', icon: '⌁' },
  { name: 'Family Pack', meta: 'Multi-product configuration', icon: '●' },
]

const nav = [
  { label: 'Products', href: '/products' },
  { label: 'Science', href: '/research' },
  { label: 'Labs', href: '/labs' },
  { label: 'Business', href: '/business' },
  { label: 'About', href: '/about' },
  { label: 'Cart', href: '/cart' },
  { label: 'Account', href: '/account' },
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
      <div className="nav-actions"><a className="pill ghost" href="/verify">Verify</a><a className="pill light" href="/products/shieldtag-pro">Explore ShieldTag →</a></div>
      <button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">☰</button>
    </div></header>

    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="dot" /> RADVORA · RF TECHNOLOGY PLATFORM</div>
          <h1>Technology you can <em>measure.</em></h1>
          <p className="lead">RADVORA develops RF-focused accessories and digital-wellness technology with a simple rule: evidence before marketing. Explore products, compatibility, verification, research and business programs from one platform.</p>
          <div className="hero-actions"><a className="pill light" href="/products/shieldtag-pro">Explore ShieldTag Pro →</a><a className="pill ghost" href="/research">See our evidence model ↗</a></div>
          <div className="trust-row"><span>Serialized authenticity</span><span>Evidence-gated claims</span><span>Compatibility records</span></div>
        </div>
        <div className="hero-product"><ShieldTag3D/></div>
      </section>

      <section className="shell section">
        <div className="section-head"><div><span className="kicker">RADVORA ECOSYSTEM</span><h2>Products designed around transparent engineering.</h2></div><a href="/products">View all products →</a></div>
        <div className="product-showcase">
          <div className="product-tabs">{products.map((p,i)=><button key={p.name} onClick={()=>setActiveProduct(i)} className={i===activeProduct?'active':''}><span>{p.icon}</span><div><b>{p.name}</b><small>{p.meta}</small></div></button>)}</div>
          <div className="product-preview glass"><span className="kicker">CATALOG FAMILY</span><h3>{products[activeProduct].name}</h3><p>{products[activeProduct].meta}. Product-specific commercial availability, compatibility and evidence status are shown only on the corresponding live product record.</p><a className="pill ghost" href="/products">Open catalog →</a></div>
        </div>
      </section>

      <section className="science section"><div className="shell science-grid"><div><span className="kicker">EVIDENCE MODEL</span><h2>Claims move only when evidence moves.</h2><p>Prototype and pre-test statements stay clearly separated from approved performance claims. Scientific and compliance reviews remain human-controlled before publication.</p><div className="hero-actions"><a className="pill light" href="/research">Research approach →</a><a className="pill ghost" href="/labs">RADVORA Labs</a></div></div><div className="glass signal-card"><MiniWave/><div className="signal-label"><span>ILLUSTRATIVE SIGNAL</span><b>No unverified performance number</b></div></div></div></section>

      <section className="shell section"><div className="trust-grid"><article className="glass"><span className="kicker">01 · VERIFY</span><h3>Serialized authenticity.</h3><p>Check supported product serials through the server-backed verification flow without treating authenticity as proof of scientific performance.</p><a href="/verify">Verify product →</a></article><article className="glass"><span className="kicker">02 · COMPATIBILITY</span><h3>Known device support.</h3><p>Reviewed combinations are published as compatible, limited, or not compatible. Unknown devices stay unknown.</p><a href="/compatibility">Check compatibility →</a></article><article className="glass"><span className="kicker">03 · SUPPORT</span><h3>Traceable customer care.</h3><p>Registered products can connect to support and warranty history through the customer account.</p><a href="/support">Customer support →</a></article></div></section>

      <section className="shell final-cta"><div><span className="kicker">INDIA-FIRST LAUNCH</span><h2>Built for a measured launch, not inflated promises.</h2><p>RADVORA is preparing its consumer commerce flow for India while product evidence, verification and support systems remain independently traceable.</p></div><div className="hero-actions"><a className="pill light" href="/products">Explore products →</a><a className="pill ghost" href="/business">Business enquiries</a></div></section>
    </main>

    <footer><div className="shell footer-grid"><div><a className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></a><p>Technology you can measure.</p></div><div><b>Product</b><a href="/products">Products</a><a href="/verify">Verify</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div><div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/labs">Labs</a><a href="/business">Business</a></div><div><b>Customer</b><a href="/account">Account</a><a href="/cart">Cart</a><a href="/support">Support</a><a href="/warranty">Warranty</a></div><div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div></div></footer>
  </>
}
