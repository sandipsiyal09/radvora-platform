'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './home.module.css'

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

function ShieldTagScene() {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const rotation = useRef({ x: -11, y: -22 })

  const applyRotation = () => {
    if (!ref.current) return
    ref.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
  }

  useEffect(() => applyRotation(), [])

  return (
    <div
      className={styles.stage}
      onPointerMove={(event) => {
        if (!dragging.current) return
        rotation.current.y += event.movementX * 0.34
        rotation.current.x -= event.movementY * 0.22
        rotation.current.x = Math.max(-30, Math.min(28, rotation.current.x))
        applyRotation()
      }}
      onPointerUp={() => { dragging.current = false }}
      onPointerLeave={() => { dragging.current = false }}
    >
      <div className={styles.halo} />
      <div className={`${styles.orbit} ${styles.orbit1}`} />
      <div className={`${styles.orbit} ${styles.orbit2}`} />
      <div className={`${styles.orbit} ${styles.orbit3}`} />
      <div className={`${styles.node} ${styles.nodeA}`} />
      <div className={`${styles.node} ${styles.nodeB}`} />
      <div className={`${styles.node} ${styles.nodeC}`} />
      <div className={styles.shadow} />
      <div
        ref={ref}
        className={styles.discWrap}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragging.current = true
        }}
      >
        <div className={styles.disc}>
          <div className={styles.discFace}>
            <div className={styles.discLogo}>A</div>
            <strong>RADVORA</strong>
            <small>SHIELDTAG PRO</small>
          </div>
          <div className={styles.discEdge} />
        </div>
      </div>
      <div className={`${styles.floatBadge} ${styles.badgeA}`}>AUTHENTICITY<strong>Serialized verification</strong></div>
      <div className={`${styles.floatBadge} ${styles.badgeB}`}>CLAIM CONTROL<strong>Evidence-gated publishing</strong></div>
      <div className={styles.dragHint}>↔ DRAG TO ROTATE</div>
    </div>
  )
}

function SignalWave() {
  return (
    <svg className={styles.wave} viewBox="0 0 640 240" role="img" aria-label="Illustrative signal waveform">
      <defs>
        <linearGradient id="signalGradient" x1="0" x2="1">
          <stop offset="0" stopColor="#4c8cff" stopOpacity="0" />
          <stop offset=".45" stopColor="#78c8ff" />
          <stop offset=".6" stopColor="#7ee7ff" />
          <stop offset="1" stopColor="#7ee7ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <path
          key={item}
          d={`M0 ${122 + item * 2} C78 ${26 + item * 8}, 128 ${214 - item * 7}, 204 ${120 + item * 2} S342 ${24 + item * 8}, 410 ${120 - item * 2} S532 ${202 - item * 5}, 640 ${120 + item}`}
          fill="none"
          stroke="url(#signalGradient)"
          strokeWidth={1.2 + item * 0.17}
          opacity={0.22 + item * 0.11}
        />
      ))}
    </svg>
  )
}

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [activeProduct, setActiveProduct] = useState(0)

  useEffect(() => {
    const onPointerMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', `${event.clientX}px`)
      document.documentElement.style.setProperty('--my', `${event.clientY}px`)
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-home-reveal]'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14 })

    nodes.forEach((node) => observer.observe(node))
    window.addEventListener('mousemove', onPointerMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.cursorAura} />
      <div className={styles.noise} />

      <header className={styles.nav}>
        <div className={`${styles.shell} ${styles.navInner}`}>
          <a className={styles.brand} href="/"><strong>RADVORA</strong><span>TECHNOLOGIES</span></a>
          <nav className={`${styles.links} ${menu ? styles.linksOpen : ''}`}>
            {nav.map((item) => <a key={item.label} href={item.href} onClick={() => setMenu(false)}>{item.label}</a>)}
          </nav>
          <div className={styles.navActions}>
            <a className={`${styles.pill} ${styles.ghost}`} href="/verify">Verify</a>
            <a className={`${styles.pill} ${styles.primary}`} href="/products/shieldtag-pro">Explore ShieldTag →</a>
          </div>
          <button className={styles.menu} aria-label="Toggle navigation" onClick={() => setMenu((value) => !value)}>☰</button>
        </div>
      </header>

      <main>
        <section className={`${styles.shell} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={`${styles.heroCopy} ${styles.reveal} ${styles.visible}`}>
              <div className={styles.eyebrow}><span className={styles.pulseDot} /> RADVORA · RF TECHNOLOGY PLATFORM</div>
              <h1 className={styles.heroTitle}>Technology you can <span><em>measure.</em></span></h1>
              <p className={styles.lead}>RF-focused accessories and digital-wellness technology built around one principle: evidence before marketing. Product status, compatibility, verification and research remain traceable across the platform.</p>
              <div className={styles.actions}>
                <a className={`${styles.pill} ${styles.primary}`} href="/products/shieldtag-pro">Explore ShieldTag Pro →</a>
                <a className={`${styles.pill} ${styles.ghost}`} href="/research">See our evidence model ↗</a>
              </div>
              <div className={styles.trustRow}>
                <div className={styles.trustItem}><strong>Serialized authenticity</strong><span>Server-backed verification records</span></div>
                <div className={styles.trustItem}><strong>Evidence-gated claims</strong><span>Human scientific and compliance review</span></div>
                <div className={styles.trustItem}><strong>Compatibility records</strong><span>Known, limited or explicitly unknown</span></div>
              </div>
            </div>

            <div className={`${styles.visualCard} ${styles.reveal} ${styles.delay1} ${styles.visible}`}>
              <div className={styles.visualLabel}>INTERACTIVE PRODUCT MODEL</div>
              <ShieldTagScene />
            </div>
          </div>
        </section>

        <div className={styles.band} aria-hidden="true">
          <div className={styles.marquee}>
            {[...Array(2)].flatMap((_, group) => ['SERIALIZED VERIFICATION', 'EVIDENCE BEFORE MARKETING', 'INDIA-FIRST COMMERCE', 'HUMAN APPROVAL GATES', 'COMPATIBILITY RECORDS', 'TRACEABLE SUPPORT'].map((label) => <span key={`${group}-${label}`}><i />{label}</span>))}
          </div>
        </div>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-home-reveal>
            <div><span className={styles.kicker}>RADVORA ECOSYSTEM</span><h2>One product system. Multiple layers of trust.</h2></div>
            <p>Move through the product family without hiding commercial status, compatibility limits or evidence state behind visual polish.</p>
          </div>

          <div className={styles.ecosystem}>
            <div className={`${styles.tabs} ${styles.reveal}`} data-home-reveal>
              {products.map((product, index) => (
                <button key={product.name} className={`${styles.tab} ${index === activeProduct ? styles.tabActive : ''}`} onClick={() => setActiveProduct(index)}>
                  <span className={styles.tabIcon}>{product.icon}</span>
                  <span><strong>{product.name}</strong><small>{product.meta}</small></span>
                </button>
              ))}
            </div>

            <div className={`${styles.preview} ${styles.reveal} ${styles.delay1}`} data-home-reveal>
              <div className={styles.previewContent}>
                <span className={styles.kicker}>CATALOG FAMILY</span>
                <h3>{products[activeProduct].name}</h3>
                <p>{products[activeProduct].meta}. Product-specific commercial availability, compatibility and evidence status are shown only on the corresponding live product record.</p>
                <div className={styles.previewMeta}><span>STATUS-AWARE</span><span>TRACEABLE</span><span>NO IMPLIED CLAIMS</span></div>
                <a className={`${styles.pill} ${styles.ghost}`} href="/products">Open catalog →</a>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.science}>
            <div className={`${styles.scienceCard} ${styles.reveal}`} data-home-reveal>
              <span className={styles.kicker}>EVIDENCE MODEL</span>
              <h2>Claims move only when evidence moves.</h2>
              <p>Prototype and pre-test statements remain separate from approved performance claims. Scientific and compliance review remain human-controlled before publication.</p>
              <div className={styles.actions}>
                <a className={`${styles.pill} ${styles.primary}`} href="/research">Research approach →</a>
                <a className={`${styles.pill} ${styles.ghost}`} href="/labs">RADVORA Labs</a>
              </div>
            </div>
            <div className={`${styles.signalCard} ${styles.reveal} ${styles.delay1}`} data-home-reveal>
              <div className={styles.signalGrid} />
              <SignalWave />
              <div className={styles.signalLabel}><span>ILLUSTRATIVE SIGNAL</span><strong>No unverified performance number</strong></div>
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.cards}>
            <article className={`${styles.card} ${styles.reveal}`} data-home-reveal><span className={styles.cardIndex}>01 · VERIFY</span><h3>Serialized authenticity.</h3><p>Check supported product serials through the server-backed verification flow without treating authenticity as scientific proof.</p><a href="/verify">Verify product →</a></article>
            <article className={`${styles.card} ${styles.reveal} ${styles.delay1}`} data-home-reveal><span className={styles.cardIndex}>02 · COMPATIBILITY</span><h3>Known device support.</h3><p>Reviewed combinations publish as compatible, limited or not compatible. Unknown devices stay explicitly unknown.</p><a href="/compatibility">Check compatibility →</a></article>
            <article className={`${styles.card} ${styles.reveal} ${styles.delay2}`} data-home-reveal><span className={styles.cardIndex}>03 · SUPPORT</span><h3>Traceable customer care.</h3><p>Registered products can connect to support and warranty history through the customer account and controlled service flows.</p><a href="/support">Customer support →</a></article>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.finalCta} ${styles.reveal}`} data-home-reveal>
          <div><span className={styles.kicker}>INDIA-FIRST LAUNCH</span><h2>Built for a measured launch, not inflated promises.</h2><p>RADVORA is preparing its India consumer-commerce flow while verification, product evidence and customer-support systems remain independently traceable.</p></div>
          <div className={styles.actions}><a className={`${styles.pill} ${styles.primary}`} href="/products">Explore products →</a><a className={`${styles.pill} ${styles.ghost}`} href="/business">Business enquiries</a></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerGrid}`}>
          <div><a className={styles.brand} href="/"><strong>RADVORA</strong><span>TECHNOLOGIES</span></a><p>Technology you can measure.</p></div>
          <div><b>Product</b><a href="/products">Products</a><a href="/verify">Verify</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div>
          <div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/labs">Labs</a><a href="/business">Business</a></div>
          <div><b>Customer</b><a href="/account">Account</a><a href="/cart">Cart</a><a href="/support">Support</a><a href="/warranty">Warranty</a></div>
          <div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div>
        </div>
      </footer>
    </div>
  )
}
