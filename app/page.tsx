'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './home.module.css'

const products = [
  { name: 'ShieldTag Pro', meta: 'Flagship · Serialized', icon: '◉', code: 'PRO' },
  { name: 'ShieldTag Core', meta: 'ShieldTag product family', icon: '◇', code: 'CORE' },
  { name: 'ShieldTag Elite', meta: 'ShieldTag product family', icon: '◆', code: 'ELITE' },
  { name: 'RF Case', meta: 'RF-focused accessory', icon: '▣', code: 'CASE' },
  { name: 'SafeStand', meta: 'Distance-first design', icon: '⌁', code: 'STAND' },
  { name: 'Family Pack', meta: 'Multi-product configuration', icon: '●', code: 'FAMILY' },
]

const nav = [
  { label: 'Products', href: '/products' },
  { label: 'Science', href: '/research' },
  { label: 'Labs', href: '/labs' },
  { label: 'Business', href: '/business' },
  { label: 'About', href: '/about' },
  { label: 'Account', href: '/account' },
]

function MagneticLink({ href, children, tone = 'primary' }: { href: string; children: React.ReactNode; tone?: 'primary' | 'ghost' }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <a
      ref={ref}
      className={`${styles.pill} ${tone === 'primary' ? styles.primary : styles.ghost}`}
      href={href}
      onPointerMove={(event) => {
        const node = ref.current
        if (!node) return
        const rect = node.getBoundingClientRect()
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12
        node.style.transform = `translate3d(${x}px,${y}px,0) translateY(-2px)`
      }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = '' }}
    >
      {children}
    </a>
  )
}

function SpatialCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let frame = 0
    let raf = 0
    const pointer = { x: -9999, y: -9999 }
    const particles = Array.from({ length: 58 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00013,
      vy: (Math.random() - 0.5) * 0.00011,
      r: 0.7 + Math.random() * 1.4,
      phase: index * 0.43,
    }))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const draw = () => {
      frame += 1
      ctx.clearRect(0, 0, width, height)
      const positions = particles.map((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        if (particle.x < -0.04) particle.x = 1.04
        if (particle.x > 1.04) particle.x = -0.04
        if (particle.y < -0.04) particle.y = 1.04
        if (particle.y > 1.04) particle.y = -0.04
        return { x: particle.x * width, y: particle.y * height, r: particle.r, phase: particle.phase }
      })

      for (let i = 0; i < positions.length; i += 1) {
        const a = positions[i]
        for (let j = i + 1; j < positions.length; j += 1) {
          const b = positions[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 150) {
            ctx.strokeStyle = `rgba(91,182,255,${(1 - distance / 150) * 0.085})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      positions.forEach((particle) => {
        const distanceToPointer = Math.hypot(particle.x - pointer.x, particle.y - pointer.y)
        const glow = distanceToPointer < 180 ? 0.72 : 0.28 + Math.sin(frame * 0.018 + particle.phase) * 0.1
        ctx.fillStyle = `rgba(127,224,255,${glow})`
        ctx.shadowBlur = distanceToPointer < 180 ? 18 : 7
        ctx.shadowColor = 'rgba(74,170,255,.65)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.spatialCanvas} aria-hidden="true" />
}

function ShieldTagScene() {
  const ref = useRef<HTMLDivElement>(null)
  const rotation = useRef({ x: -12, y: -24 })
  const dragging = useRef(false)

  const apply = () => {
    if (!ref.current) return
    ref.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
  }

  useEffect(() => apply(), [])

  return (
    <div
      className={styles.stage}
      onPointerMove={(event) => {
        if (!dragging.current) return
        rotation.current.y += event.movementX * 0.34
        rotation.current.x -= event.movementY * 0.22
        rotation.current.x = Math.max(-32, Math.min(30, rotation.current.x))
        apply()
      }}
      onPointerUp={() => { dragging.current = false }}
      onPointerLeave={() => { dragging.current = false }}
    >
      <div className={styles.heroPortal} />
      <div className={`${styles.orbit} ${styles.orbit1}`} />
      <div className={`${styles.orbit} ${styles.orbit2}`} />
      <div className={`${styles.orbit} ${styles.orbit3}`} />
      <div className={`${styles.orbit} ${styles.orbit4}`} />
      <div className={`${styles.energyNode} ${styles.node1}`} />
      <div className={`${styles.energyNode} ${styles.node2}`} />
      <div className={`${styles.energyNode} ${styles.node3}`} />
      <div className={styles.discShadow} />
      <div
        ref={ref}
        className={styles.discWrap}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragging.current = true
        }}
      >
        <div className={styles.discCore}>
          <div className={styles.discFace}>
            <div className={styles.discSweep} />
            <div className={styles.discLogo}>A</div>
            <strong>RADVORA</strong>
            <small>SHIELDTAG PRO</small>
          </div>
          <div className={styles.discEdge} />
        </div>
      </div>
      <div className={`${styles.hudCard} ${styles.hudA}`}><span>01</span><b>SERIALIZED</b><small>Verification record</small></div>
      <div className={`${styles.hudCard} ${styles.hudB}`}><span>02</span><b>EVIDENCE GATE</b><small>Human-controlled claims</small></div>
      <div className={`${styles.hudCard} ${styles.hudC}`}><span>03</span><b>COMPATIBILITY</b><small>Status-aware records</small></div>
      <div className={styles.dragHint}>DRAG · ROTATE · EXPLORE</div>
    </div>
  )
}

function EvidenceFlow() {
  const steps = ['Research', 'Testing', 'Review', 'Approval', 'Publication']
  return (
    <div className={styles.evidenceFlow}>
      <div className={styles.flowBeam} />
      {steps.map((step, index) => (
        <div className={styles.flowStep} key={step}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div className={styles.flowDot}><i /></div>
          <b>{step}</b>
          <small>{index === 4 ? 'Only approved language becomes public' : 'Controlled evidence state'}</small>
        </div>
      ))}
    </div>
  )
}

function SpectrumVisual() {
  const heights = [24, 35, 48, 72, 43, 64, 82, 58, 91, 63, 45, 76, 54, 88, 67, 42, 71, 53, 84, 61, 39, 69, 47, 78, 56, 33, 62, 49]
  return (
    <div className={styles.spectrum} aria-label="Illustrative signal spectrum">
      <div className={styles.spectrumBars}>
        {heights.map((height, index) => <i key={`${height}-${index}`} style={{ height: `${height}%`, animationDelay: `${-index * 0.08}s` }} />)}
      </div>
      <div className={styles.spectrumAxis}><span>LOW</span><span>ILLUSTRATIVE VISUALIZATION</span><span>HIGH</span></div>
    </div>
  )
}

function CompatibilityConstellation() {
  const nodes = [
    { x: 50, y: 50, label: 'RADVORA', core: true },
    { x: 18, y: 22, label: 'PHONE' },
    { x: 82, y: 20, label: 'TABLET' },
    { x: 89, y: 65, label: 'LAPTOP' },
    { x: 62, y: 86, label: 'ACCESSORY' },
    { x: 16, y: 72, label: 'DEVICE' },
  ]
  return (
    <div className={styles.constellation}>
      <svg viewBox="0 0 100 100" role="img" aria-label="Illustrative compatibility network">
        <defs>
          <linearGradient id="lineGlow" x1="0" x2="1"><stop offset="0" stopColor="#5f7cff"/><stop offset="1" stopColor="#7ee7ff"/></linearGradient>
        </defs>
        {nodes.slice(1).map((node) => <line key={node.label} x1="50" y1="50" x2={node.x} y2={node.y} className={styles.networkLine} />)}
        <circle cx="50" cy="50" r="29" className={styles.networkRing} />
        <circle cx="50" cy="50" r="40" className={`${styles.networkRing} ${styles.networkRingOuter}`} />
        {nodes.map((node) => (
          <g key={node.label} className={node.core ? styles.networkCore : styles.networkNode}>
            <circle cx={node.x} cy={node.y} r={node.core ? 6.5 : 3.2} />
            <text x={node.x} y={node.y + (node.core ? 11 : 7)} textAnchor="middle">{node.label}</text>
          </g>
        ))}
      </svg>
      <div className={styles.constellationLegend}><span><i />Reviewed relationship</span><span><i />Unknown stays unknown</span></div>
    </div>
  )
}

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [activeProduct, setActiveProduct] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    const onMove = (event: PointerEvent) => {
      root.style.setProperty('--mx', `${event.clientX}px`)
      root.style.setProperty('--my', `${event.clientY}px`)
      root.style.setProperty('--nx', `${(event.clientX / window.innerWidth - 0.5).toFixed(4)}`)
      root.style.setProperty('--ny', `${(event.clientY / window.innerHeight - 0.5).toFixed(4)}`)
    }
    const onScroll = () => root.style.setProperty('--scroll', `${window.scrollY}`)
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add(styles.visible)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    elements.forEach((element) => observer.observe(element))
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className={styles.page}>
      <SpatialCanvas />
      <div className={styles.cursorAura} aria-hidden="true" />
      <div className={styles.auroraA} aria-hidden="true" />
      <div className={styles.auroraB} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.nav}>
        <div className={`${styles.shell} ${styles.navInner}`}>
          <a className={styles.brand} href="/"><strong>RADVORA</strong><span>TECHNOLOGIES</span></a>
          <nav className={`${styles.links} ${menu ? styles.linksOpen : ''}`}>
            {nav.map((item) => <a href={item.href} key={item.label} onClick={() => setMenu(false)}>{item.label}</a>)}
          </nav>
          <div className={styles.navActions}><a href="/verify" className={styles.navUtility}>VERIFY</a><MagneticLink href="/products/shieldtag-pro">Explore product →</MagneticLink></div>
          <button className={styles.menu} onClick={() => setMenu((value) => !value)} aria-label="Toggle navigation">☰</button>
        </div>
      </header>

      <main>
        <section className={`${styles.shell} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={`${styles.heroCopy} ${styles.reveal} ${styles.visible}`}>
              <div className={styles.eyebrow}><span /> RADVORA SPATIAL TECHNOLOGY SYSTEM</div>
              <h1>Technology becomes <em>credible</em> when you can trace it.</h1>
              <p className={styles.heroLead}>An immersive product platform built around verification, compatibility, evidence states and controlled claims—not decorative promises.</p>
              <div className={styles.actions}><MagneticLink href="/products/shieldtag-pro">Enter ShieldTag →</MagneticLink><MagneticLink href="/research" tone="ghost">Explore evidence system ↗</MagneticLink></div>
              <div className={styles.heroMetrics}>
                <div><span>01</span><b>VERIFY</b><small>Serialized authenticity</small></div>
                <div><span>02</span><b>REVIEW</b><small>Human approval gates</small></div>
                <div><span>03</span><b>TRACE</b><small>Compatibility records</small></div>
              </div>
            </div>
            <div className={`${styles.heroVisual} ${styles.reveal} ${styles.visible}`}>
              <div className={styles.visualTopline}><span>SPATIAL MODEL / 01</span><span className={styles.liveDot}>INTERACTIVE</span></div>
              <ShieldTagScene />
            </div>
          </div>
          <div className={styles.scrollCue}><span>SCROLL TO ENTER THE SYSTEM</span><i /></div>
        </section>

        <section className={styles.cinematicBand} aria-hidden="true">
          <div className={styles.bandTrack}>{[...Array(2)].flatMap((_, g) => ['EVIDENCE BEFORE MARKETING','SERIALIZED VERIFICATION','COMPATIBILITY WITH CONTEXT','HUMAN CONTROLLED CLAIMS','TRACEABLE SUPPORT'].map((label) => <span key={`${g}-${label}`}><i />{label}</span>))}</div>
        </section>

        <section className={`${styles.shell} ${styles.storySection}`}>
          <div className={`${styles.storyIntro} ${styles.reveal}`} data-reveal>
            <span className={styles.kicker}>A MULTI-LAYER EXPERIENCE</span>
            <h2>Not “6D” as a gimmick. <em>Depth, motion, context and response</em> working together.</h2>
            <p>The interface combines spatial layering, reactive lighting, parallax, motion, evidence visualization and interaction to create a richer dimensional experience while keeping every factual claim conservative.</p>
          </div>
          <div className={styles.dimensionGrid}>
            {[
              ['01','DEPTH','Layered spatial composition'],['02','MOTION','Reactive movement and inertia'],['03','LIGHT','Cursor-linked illumination'],['04','DATA','Evidence and signal visualization'],['05','CONTEXT','Status-aware product information'],['06','CONTROL','Human approval and verification'],['07','TRACE','Connected product records'],['08','ACCESS','Responsive reduced-motion fallback'],
            ].map(([number,title,body], index) => <article className={`${styles.dimensionCard} ${styles.reveal}`} data-reveal key={number} style={{ transitionDelay: `${Math.min(index,4) * 60}ms` }}><span>{number}</span><b>{title}</b><p>{body}</p></article>)}
          </div>
        </section>

        <section className={`${styles.shell} ${styles.productUniverse}`}>
          <div className={`${styles.productNav} ${styles.reveal}`} data-reveal>
            <span className={styles.kicker}>PRODUCT UNIVERSE</span>
            <h2>Move through the system.</h2>
            <div className={styles.productSelector}>{products.map((product,index) => <button key={product.name} onClick={() => setActiveProduct(index)} className={index === activeProduct ? styles.productActive : ''}><span>{product.icon}</span><b>{product.code}</b><small>{product.name}</small></button>)}</div>
          </div>
          <div className={`${styles.productStage} ${styles.reveal}`} data-reveal>
            <div className={styles.productRings}><i/><i/><i/></div>
            <div className={styles.productObject}><span>{products[activeProduct].icon}</span><strong>{products[activeProduct].name}</strong><small>{products[activeProduct].meta}</small></div>
            <div className={styles.productReadout}><span>LIVE CATALOG CONTEXT</span><p>Commercial status, compatibility and evidence state are sourced from the corresponding product record. Visual presentation never overrides readiness state.</p><a href="/products">Open product catalog →</a></div>
          </div>
        </section>

        <section className={styles.evidenceSection}>
          <div className={`${styles.shell} ${styles.evidenceGrid}`}>
            <div className={`${styles.evidenceCopy} ${styles.reveal}`} data-reveal><span className={styles.kicker}>EVIDENCE ENGINE</span><h2>Claims move only when evidence moves.</h2><p>Each stage is intentionally separated so prototypes, pending work and reviewed claims cannot collapse into the same marketing language.</p><MagneticLink href="/research">See research model →</MagneticLink></div>
            <div className={`${styles.evidenceVisual} ${styles.reveal}`} data-reveal><div className={styles.visualTopline}><span>CONTROLLED PIPELINE</span><span>HUMAN GATES</span></div><EvidenceFlow /></div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.visualizationSection}`}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal><div><span className={styles.kicker}>VISUAL SYSTEMS</span><h2>See relationships, not fabricated numbers.</h2></div><p>These visualizations explain system behavior and information flow. They are explicitly illustrative—not measurements or scientific results.</p></div>
          <div className={styles.visualizationGrid}>
            <article className={`${styles.vizCard} ${styles.reveal}`} data-reveal><div className={styles.vizHeader}><span>SIGNAL FIELD</span><b>Illustrative spectrum</b></div><SpectrumVisual/><p>Animated frequency-style movement gives the interface energy without presenting unverified performance data.</p></article>
            <article className={`${styles.vizCard} ${styles.reveal}`} data-reveal><div className={styles.vizHeader}><span>COMPATIBILITY MAP</span><b>Relationship constellation</b></div><CompatibilityConstellation/><p>Known relationships can be visualized while unsupported or unknown device combinations remain explicitly unknown.</p></article>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.trustSection}`}>
          <div className={`${styles.trustPanel} ${styles.reveal}`} data-reveal>
            <div><span className={styles.kicker}>TRUST LAYERS</span><h2>Verification is a system, not a badge.</h2><p>Product authenticity, compatibility, evidence state, warranty history and customer support are separate records with separate meanings.</p></div>
            <div className={styles.trustStack}>{[['01','SERIAL','Authenticity record'],['02','DEVICE','Compatibility state'],['03','EVIDENCE','Claim approval state'],['04','SUPPORT','Warranty & service history']].map(([n,t,b]) => <a href={t === 'SERIAL' ? '/verify' : t === 'DEVICE' ? '/compatibility' : t === 'EVIDENCE' ? '/research' : '/support'} key={n}><span>{n}</span><b>{t}</b><small>{b}</small><i>↗</i></a>)}</div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.finalCta} ${styles.reveal}`} data-reveal>
          <div className={styles.finalOrb}><i/><i/><i/></div>
          <div className={styles.finalContent}><span className={styles.kicker}>RADVORA · INDIA-FIRST</span><h2>Enter a product experience designed to feel advanced—and stay accountable.</h2><p>Explore products, evidence, compatibility and verification without turning visual sophistication into unsupported claims.</p><div className={styles.actions}><MagneticLink href="/products">Explore products →</MagneticLink><MagneticLink href="/business" tone="ghost">Business enquiries</MagneticLink></div></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerGrid}`}>
          <div><a className={styles.brand} href="/"><strong>RADVORA</strong><span>TECHNOLOGIES</span></a><p>Technology you can measure.</p></div>
          <div><b>Product</b><a href="/products">Products</a><a href="/verify">Verify</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div>
          <div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/labs">Labs</a><a href="/business">Business</a></div>
          <div><b>Customer</b><a href="/account">Account</a><a href="/support">Support</a><a href="/warranty">Warranty</a><a href="/cart">Cart</a></div>
          <div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div>
        </div>
      </footer>
    </div>
  )
}
