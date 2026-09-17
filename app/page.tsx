'use client'

import { useEffect, useRef, useState } from 'react'
import './home-premium.css'

const products = [
  { name: 'ShieldTag Pro', meta: 'Flagship · Serialized', icon: '◉', copy: 'A premium serialized product surface with verification, compatibility and evidence status kept visible.' },
  { name: 'ShieldTag Core', meta: 'ShieldTag family', icon: '◇', copy: 'A focused entry in the ShieldTag family, presented without overstating unverified performance.' },
  { name: 'ShieldTag Elite', meta: 'ShieldTag family', icon: '◆', copy: 'A premium-format product concept with the same evidence-first publication controls.' },
  { name: 'RF Case', meta: 'RF-focused accessory', icon: '▣', copy: 'An accessory concept positioned around measurable engineering and device compatibility.' },
  { name: 'SafeStand', meta: 'Distance-first design', icon: '⌁', copy: 'A distance-first accessory concept designed around practical use and transparent guidance.' },
  { name: 'Family Pack', meta: 'Multi-product setup', icon: '●', copy: 'A multi-product configuration for households, with each item retaining its own status and records.' },
]

const nav = [
  { label: 'Products', href: '/products' },
  { label: 'Science', href: '/research' },
  { label: 'Labs', href: '/labs' },
  { label: 'Business', href: '/business' },
  { label: 'About', href: '/about' },
]

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`rv-reveal ${className}`}>{children}</div>
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--tilt-x', `${(0.5 - y) * 8}deg`)
    el.style.setProperty('--tilt-y', `${(x - 0.5) * 10}deg`)
    el.style.setProperty('--shine-x', `${x * 100}%`)
    el.style.setProperty('--shine-y', `${y * 100}%`)
  }
  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }
  return <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`rv-tilt ${className}`}>{children}</div>
}

function ShieldTag3D() {
  const ref = useRef<HTMLDivElement>(null)
  const rotation = useRef({ x: -10, y: -22 })
  const dragging = useRef(false)

  const apply = () => {
    if (!ref.current) return
    ref.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
  }

  useEffect(() => apply(), [])

  return (
    <div className="rv-stage"
      onPointerMove={(e) => {
        if (!dragging.current) return
        rotation.current.y += e.movementX * 0.36
        rotation.current.x -= e.movementY * 0.24
        rotation.current.x = Math.max(-30, Math.min(28, rotation.current.x))
        apply()
      }}
      onPointerUp={() => { dragging.current = false }}
      onPointerLeave={() => { dragging.current = false }}>
      <div className="rv-aura rv-aura-a" />
      <div className="rv-aura rv-aura-b" />
      <div className="rv-orbit rv-orbit-a"><i /><i /><i /></div>
      <div className="rv-orbit rv-orbit-b"><i /><i /></div>
      <div className="rv-orbit rv-orbit-c" />
      <div className="rv-floor-grid" />
      <div className="rv-device-shadow" />
      <div ref={ref} className="rv-device"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true }}>
        <div className="rv-device-back" />
        <div className="rv-device-edge" />
        <div className="rv-device-face">
          <div className="rv-device-rim" />
          <div className="rv-device-core">
            <div className="rv-mark">R</div>
            <strong>RADVORA</strong>
            <span>SHIELDTAG PRO</span>
          </div>
          <div className="rv-device-scan" />
        </div>
      </div>
      <div className="rv-stage-badge rv-stage-badge-one"><b>01</b><span>SERIALIZED</span></div>
      <div className="rv-stage-badge rv-stage-badge-two"><b>02</b><span>EVIDENCE-GATED</span></div>
      <div className="rv-drag-hint"><span>↔</span> drag to rotate</div>
    </div>
  )
}

function SignalMesh() {
  return <svg className="rv-signal" viewBox="0 0 700 300" role="img" aria-label="Illustrative signal visualization">
    <defs>
      <linearGradient id="rvWave" x1="0" x2="1"><stop offset="0" stopColor="#6e8cff" stopOpacity="0"/><stop offset=".42" stopColor="#7bd8ff"/><stop offset=".72" stopColor="#a2fff3"/><stop offset="1" stopColor="#6e8cff" stopOpacity="0"/></linearGradient>
      <radialGradient id="rvGlow"><stop offset="0" stopColor="#79dcff" stopOpacity=".6"/><stop offset="1" stopColor="#79dcff" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="470" cy="145" r="110" fill="url(#rvGlow)" opacity=".12" />
    {[0,1,2,3,4,5].map(i => <path key={i} className={`rv-wave rv-wave-${i}`} d={`M0 ${145+i*4} C75 ${35+i*9}, 150 ${250-i*7}, 230 ${145+i*3} S390 ${45+i*6}, 470 ${145-i*2} S610 ${245-i*9}, 700 ${145+i}`} fill="none" stroke="url(#rvWave)" strokeWidth="1.35" opacity={.24+i*.11}/>) }
    <g className="rv-signal-dot"><circle cx="470" cy="145" r="7" fill="#baf7ff"/><circle cx="470" cy="145" r="20" fill="none" stroke="#8be9ff" opacity=".4"/></g>
  </svg>
}

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [activeProduct, setActiveProduct] = useState(0)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--rv-mx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--rv-my', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return <div className="rv-home">
    <div className="rv-pointer-glow" />
    <div className="rv-noise" />
    <header className="rv-nav">
      <div className="rv-shell rv-nav-inner">
        <a className="rv-brand" href="/" aria-label="RADVORA home"><span>RADVORA</span><small>TECHNOLOGIES</small></a>
        <nav className={`rv-links ${menu ? 'is-open' : ''}`}>{nav.map(item => <a key={item.label} href={item.href} onClick={() => setMenu(false)}>{item.label}</a>)}</nav>
        <div className="rv-nav-actions"><a className="rv-btn rv-btn-ghost" href="/verify">Verify</a><a className="rv-btn rv-btn-primary" href="/products/shieldtag-pro">Explore ShieldTag <span>↗</span></a></div>
        <button className="rv-menu" type="button" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(v => !v)}><span/><span/></button>
      </div>
    </header>

    <main>
      <section className="rv-hero rv-shell">
        <div className="rv-hero-grid">
          <Reveal className="rv-hero-copy">
            <div className="rv-eyebrow"><i /> RF TECHNOLOGY · INDIA-FIRST PLATFORM</div>
            <h1>Technology that feels <span>future-ready</span> and stays <em>measurable.</em></h1>
            <p>RADVORA brings product design, verification, compatibility, research and customer care into one evidence-first technology platform—built to look premium without making claims the evidence cannot support.</p>
            <div className="rv-actions"><a className="rv-btn rv-btn-primary rv-btn-large" href="/products/shieldtag-pro">Explore ShieldTag Pro <span>→</span></a><a className="rv-btn rv-btn-ghost rv-btn-large" href="/research">How evidence moves <span>↗</span></a></div>
            <div className="rv-trust-row"><div><b>Serialized</b><span>Authenticity records</span></div><div><b>Evidence-gated</b><span>Human-reviewed claims</span></div><div><b>Traceable</b><span>Compatibility & support</span></div></div>
          </Reveal>
          <Reveal className="rv-hero-visual"><ShieldTag3D/></Reveal>
        </div>
        <div className="rv-scroll-cue"><span>SCROLL TO EXPLORE</span><i/></div>
      </section>

      <section className="rv-marquee" aria-label="RADVORA platform highlights"><div className="rv-marquee-track">{Array.from({length:2}).map((_,j)=><div key={j} className="rv-marquee-set"><span>PRODUCT DESIGN</span><i/> <span>VERIFICATION</span><i/> <span>COMPATIBILITY</span><i/> <span>RESEARCH</span><i/> <span>LABS</span><i/> <span>SUPPORT</span><i/></div>)}</div></section>

      <section className="rv-section rv-shell">
        <Reveal className="rv-section-head"><div><span className="rv-kicker">RADVORA ECOSYSTEM</span><h2>One platform. Multiple product experiences. <em>One standard of proof.</em></h2></div><p>Move through the product family with interactive previews while commercial availability and scientific status remain tied to the real product record.</p></Reveal>
        <div className="rv-product-deck">
          <Reveal className="rv-product-rail">{products.map((p,i)=><button key={p.name} onClick={()=>setActiveProduct(i)} className={i===activeProduct?'is-active':''}><span className="rv-product-icon">{p.icon}</span><span><b>{p.name}</b><small>{p.meta}</small></span><i>0{i+1}</i></button>)}</Reveal>
          <Reveal className="rv-product-display">
            <TiltCard className="rv-product-card">
              <div className="rv-product-card-top"><span className="rv-kicker">CATALOG EXPERIENCE</span><span className="rv-product-number">0{activeProduct + 1}</span></div>
              <div className="rv-product-symbol"><span>{products[activeProduct].icon}</span><i/><i/></div>
              <div className="rv-product-card-copy"><h3>{products[activeProduct].name}</h3><p>{products[activeProduct].copy}</p><a href="/products" className="rv-inline-link">Open live catalog <span>→</span></a></div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      <section className="rv-section rv-science-wrap">
        <div className="rv-shell rv-science-grid">
          <Reveal className="rv-science-copy"><span className="rv-kicker">EVIDENCE MODEL</span><h2>Claims move only when <em>evidence moves.</em></h2><p>Prototype language stays separate from approved performance claims. Scientific and compliance review remain human-controlled before anything becomes a public claim.</p><div className="rv-actions"><a className="rv-btn rv-btn-primary" href="/research">Research approach <span>→</span></a><a className="rv-btn rv-btn-ghost" href="/labs">Enter RADVORA Labs</a></div></Reveal>
          <Reveal className="rv-signal-card"><div className="rv-signal-top"><span>LIVE VISUAL SYSTEM</span><b>Illustrative signal only</b></div><SignalMesh/><div className="rv-signal-footer"><span>No unverified performance number</span><span>Human approval gate active</span></div></Reveal>
        </div>
      </section>

      <section className="rv-section rv-shell">
        <Reveal className="rv-section-head rv-section-head-tight"><div><span className="rv-kicker">TRUST ARCHITECTURE</span><h2>Every important action has a <em>traceable path.</em></h2></div></Reveal>
        <div className="rv-trust-grid">
          <Reveal><TiltCard className="rv-trust-card"><span className="rv-card-index">01</span><div className="rv-card-orb">V</div><h3>Verify authenticity</h3><p>Check supported serials through a server-backed verification flow without presenting authenticity as proof of scientific performance.</p><a href="/verify">Verify product →</a></TiltCard></Reveal>
          <Reveal><TiltCard className="rv-trust-card"><span className="rv-card-index">02</span><div className="rv-card-orb">C</div><h3>Check compatibility</h3><p>Reviewed combinations can be published as compatible, limited or not compatible. Unknown combinations remain explicitly unknown.</p><a href="/compatibility">Check compatibility →</a></TiltCard></Reveal>
          <Reveal><TiltCard className="rv-trust-card"><span className="rv-card-index">03</span><div className="rv-card-orb">S</div><h3>Keep support traceable</h3><p>Registered products can connect to support and warranty history through the customer account experience.</p><a href="/support">Customer support →</a></TiltCard></Reveal>
        </div>
      </section>

      <section className="rv-shell rv-section">
        <Reveal className="rv-manifesto">
          <div className="rv-manifesto-glow" />
          <span className="rv-kicker">DESIGN PRINCIPLE</span>
          <h2>Premium technology should feel <span>alive</span>—without turning evidence into theatre.</h2>
          <div className="rv-manifesto-foot"><p>That is why RADVORA combines cinematic interaction, precise product interfaces and deliberate scientific guardrails.</p><a className="rv-inline-link" href="/about">Inside RADVORA <span>↗</span></a></div>
        </Reveal>
      </section>

      <section className="rv-shell rv-final-wrap">
        <Reveal className="rv-final-cta"><div><span className="rv-kicker">INDIA-FIRST LAUNCH</span><h2>Explore the platform before commerce goes live.</h2><p>Product, verification, compatibility and research experiences are available while payment collection remains safely gated behind real launch readiness.</p></div><div className="rv-actions"><a className="rv-btn rv-btn-primary rv-btn-large" href="/products">Explore products <span>→</span></a><a className="rv-btn rv-btn-ghost rv-btn-large" href="/business">Business enquiries</a></div></Reveal>
      </section>
    </main>

    <footer className="rv-footer"><div className="rv-shell rv-footer-grid"><div className="rv-footer-brand"><a className="rv-brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></a><p>Technology you can measure.</p></div><div><b>Product</b><a href="/products">Products</a><a href="/verify">Verify</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div><div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/labs">Labs</a><a href="/business">Business</a></div><div><b>Customer</b><a href="/account">Account</a><a href="/cart">Cart</a><a href="/support">Support</a><a href="/warranty">Warranty</a></div><div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div></div></footer>
  </div>
}
