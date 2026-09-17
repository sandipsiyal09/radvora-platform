'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import ui from './home-experience.module.css'

type Finish = {
  name: string
  base: string
  edge: string
  accent: string
  text: string
  tone: string
}

const finishes: Finish[] = [
  { name: 'Obsidian Black', base: '#080b10', edge: '#66717d', accent: '#50e8ff', text: '#f7fbff', tone: '#151a20' },
  { name: 'Titanium Silver', base: '#aeb8c2', edge: '#f4f7fa', accent: '#bfefff', text: '#111820', tone: '#c6cdd4' },
  { name: 'Graphite', base: '#30363d', edge: '#818b95', accent: '#65d7ef', text: '#f8fbff', tone: '#414850' },
  { name: 'Arctic White', base: '#f2f5f7', edge: '#ffffff', accent: '#7fe7f2', text: '#111820', tone: '#e8ecef' },
  { name: 'Midnight Blue', base: '#102743', edge: '#587ca6', accent: '#58b8ff', text: '#f8fbff', tone: '#173755' },
  { name: 'Rose Gold', base: '#9d655e', edge: '#dcb1a5', accent: '#ffd0c7', text: '#fff9f6', tone: '#b47a72' },
  { name: 'Forest Green', base: '#183a30', edge: '#628f81', accent: '#69e9c9', text: '#f2fff9', tone: '#245044' },
  { name: 'Champagne Gold', base: '#b89b6b', edge: '#ead9b5', accent: '#ffe7af', text: '#1b160e', tone: '#c9ad79' },
]

const productFamilies = [
  { key: 'phone', name: 'ShieldTag Signature', use: 'For smartphones', line: 'Slim. Precise. Device-native.' },
  { key: 'tablet', name: 'ShieldTag Pro', use: 'For tablets', line: 'Balanced for larger surfaces.' },
  { key: 'laptop', name: 'ShieldTag Executive', use: 'For laptops', line: 'A refined hardware-style plaque.' },
  { key: 'earbuds', name: 'ShieldTag Mini', use: 'For accessories', line: 'Small device. Same identity.' },
  { key: 'power', name: 'ShieldTag Utility', use: 'For everyday tech', line: 'Flexible by design.' },
]

const steps = [
  ['Clean', 'Prepare a clean, dry compatible surface.'],
  ['Peel', 'Lift ShieldTag carefully from its backing.'],
  ['Align', 'Position it clear of cameras, ports, vents and controls.'],
  ['Press', 'Apply even pressure across the badge.'],
  ['Ready', 'Check the edges and enjoy the finished look.'],
]

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`${ui.mark} ${small ? ui.markSmall : ''}`} aria-hidden="true">
      <svg viewBox="0 0 64 64"><path d="M10 9h43L39 24H24l-5 6h25L27 50l-7-8 8-9H13L7 26l15-17Z" fill="currentColor"/><path d="M31 24h14L34 36l-8-8 5-4Z" fill="currentColor" opacity=".48"/></svg>
    </span>
  )
}

function ShieldTag({ finish, compact = false }: { finish: Finish; compact?: boolean }) {
  const style = {
    '--tag-base': finish.base,
    '--tag-edge': finish.edge,
    '--tag-accent': finish.accent,
    '--tag-text': finish.text,
  } as CSSProperties

  return (
    <span className={`${ui.shieldTag} ${compact ? ui.shieldCompact : ''}`} style={style}>
      <span className={ui.tagShine}/>
      <Mark small={compact}/>
      <span className={ui.tagWords}><b>RADVORA</b><small>SHIELDTAG</small></span>
      <i/>
    </span>
  )
}

function Device({ type, finish }: { type: string; finish: Finish }) {
  const classMap: Record<string, string> = {
    phone: ui.device_phone,
    tablet: ui.device_tablet,
    laptop: ui.device_laptop,
    earbuds: ui.device_earbuds,
    power: ui.device_power,
  }

  return (
    <span className={`${ui.device} ${classMap[type] || ''}`} data-device={type}>
      <span className={ui.deviceFace}>
        <span className={ui.deviceDetail}/>
        {type === 'phone' && <><span className={ui.camera}/><span className={ui.cameraB}/><span className={ui.cameraC}/></>}
        {type === 'tablet' && <span className={ui.cameraSolo}/>} 
        {type === 'laptop' && <span className={ui.laptopHinge}/>} 
        {type === 'earbuds' && <span className={ui.earbudLid}/>} 
        {type === 'power' && <span className={ui.powerPort}/>} 
        <ShieldTag finish={finish} compact={type === 'earbuds' || type === 'power'} />
      </span>
      {type === 'laptop' && <span className={ui.laptopBase}/>} 
      <span className={ui.deviceShadow}/>
    </span>
  )
}

export default function HomeExperience() {
  const [menu, setMenu] = useState(false)
  const [selectedFinish, setSelectedFinish] = useState(0)
  const [selectedDevice, setSelectedDevice] = useState('phone')
  const [filmStep, setFilmStep] = useState(0)
  const [filmPlaying, setFilmPlaying] = useState(true)
  const finish = finishes[selectedFinish]

  useEffect(() => {
    if (!filmPlaying) return
    const timer = window.setInterval(() => setFilmStep(step => (step + 1) % steps.length), 1800)
    return () => window.clearInterval(timer)
  }, [filmPlaying])

  useEffect(() => {
    const root = document.documentElement
    const onMove = (event: PointerEvent) => {
      root.style.setProperty('--px', `${event.clientX / window.innerWidth - 0.5}`)
      root.style.setProperty('--py', `${event.clientY / window.innerHeight - 0.5}`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const selectedFamily = useMemo(() => productFamilies.find(item => item.key === selectedDevice) || productFamilies[0], [selectedDevice])

  return (
    <div className={ui.page}>
      <header className={ui.header}>
        <div className={ui.shell}>
          <a href="/" className={ui.brand}><b>RADVORA</b><span>SHIELDTAG</span></a>
          <nav className={`${ui.nav} ${menu ? ui.navOpen : ''}`}>
            <a href="#products" onClick={() => setMenu(false)}>Products</a>
            <a href="#how-it-works" onClick={() => setMenu(false)}>How it works</a>
            <a href="/compatibility" onClick={() => setMenu(false)}>Compatibility</a>
            <a href="/about" onClick={() => setMenu(false)}>About</a>
            <a href="/support" onClick={() => setMenu(false)}>Support</a>
          </nav>
          <div className={ui.headerActions}>
            <a href="/verify" className={ui.linkButton}>Verify</a>
            <a href="/products/shieldtag-pro" className={ui.primarySmall}>Find your match <span>→</span></a>
            <button className={ui.menuButton} onClick={() => setMenu(v => !v)} aria-label="Toggle navigation">☰</button>
          </div>
        </div>
      </header>

      <main>
        <section className={ui.hero}>
          <div className={`${ui.shell} ${ui.heroGrid}`}>
            <div className={ui.heroCopy}>
              <span className={ui.kicker}>PREMIUM DEVICE IDENTITY</span>
              <h1>One Shield.<br/><em>Every Device.</em></h1>
              <p>RADVORA ShieldTag is a premium identity badge system designed to feel native to the technology you already own.</p>
              <div className={ui.heroActions}>
                <a href="#products" className={ui.primary}>Explore ShieldTag <span>→</span></a>
                <a href="#how-it-works" className={ui.secondary}><span className={ui.play}>▶</span> Watch how it works</a>
              </div>
              <div className={ui.heroProof}>
                <span><i/>Colour matched</span>
                <span><i/>Device-specific proportions</span>
                <span><i/>Premium visual finish</span>
              </div>
            </div>

            <div className={ui.heroStage} aria-label="RADVORA ShieldTag shown on multiple device types">
              <div className={ui.wave}/><div className={`${ui.wave} ${ui.waveB}`}/>
              <div className={`${ui.heroDevice} ${ui.heroPhone}`}><Device type="phone" finish={finishes[0]}/></div>
              <div className={`${ui.heroDevice} ${ui.heroTablet}`}><Device type="tablet" finish={finishes[1]}/></div>
              <div className={`${ui.heroDevice} ${ui.heroLaptop}`}><Device type="laptop" finish={finishes[2]}/></div>
              <div className={`${ui.heroDevice} ${ui.heroEarbuds}`}><Device type="earbuds" finish={finishes[3]}/></div>
              <div className={`${ui.heroDevice} ${ui.heroPower}`}><Device type="power" finish={finishes[4]}/></div>
              <div className={ui.heroStatement}><b>More than a sticker.</b><span>Designed to look like it belongs.</span></div>
            </div>
          </div>
        </section>

        <section className={ui.valueStrip}>
          <div className={ui.shell}>
            <span><Mark small/> Precision-cut identity</span>
            <span><Mark small/> Device-matched finishes</span>
            <span><Mark small/> Simple application</span>
            <span><Mark small/> Compatibility-first guidance</span>
          </div>
        </section>

        <section id="products" className={ui.productsSection}>
          <div className={ui.shell}>
            <div className={ui.sectionHeading}>
              <span>THE SHIELDTAG FAMILY</span>
              <h2>Designed for the device,<br/>not copied across it.</h2>
              <p>Each ShieldTag format has its own proportion and visual character, from compact phone badges to executive laptop plaques.</p>
            </div>
            <div className={ui.familyGrid}>
              {productFamilies.map((item, index) => (
                <button key={item.key} className={`${ui.familyCard} ${selectedDevice === item.key ? ui.familyActive : ''}`} onClick={() => setSelectedDevice(item.key)}>
                  <div className={ui.familyVisual}><Device type={item.key} finish={finishes[index % finishes.length]}/></div>
                  <span>{item.use}</span>
                  <h3>{item.name}</h3>
                  <p>{item.line}</p>
                  <i>Explore →</i>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={ui.matchSection}>
          <div className={`${ui.shell} ${ui.matchGrid}`}>
            <div className={ui.matchCopy}>
              <span>FIND YOUR MATCH</span>
              <h2>Blend in.<br/>Stand out.<br/>Make it yours.</h2>
              <p>Choose a finish that complements your device or creates a deliberate contrast. The preview updates instantly.</p>
              <div className={ui.finishGrid}>
                {finishes.map((item, index) => (
                  <button key={item.name} className={selectedFinish === index ? ui.finishActive : ''} onClick={() => setSelectedFinish(index)} aria-label={`Preview ${item.name}`}>
                    <i style={{'--swatch': item.tone, '--edge': item.edge} as CSSProperties}/><span>{item.name}</span>
                  </button>
                ))}
              </div>
              <small>Visual finish previews only. Sellable colours remain subject to approved catalogue configuration.</small>
            </div>
            <div className={ui.matchVisual}>
              <span className={ui.previewLabel}>{selectedFamily.name} · {finish.name}</span>
              <div className={ui.previewDevice}><Device type={selectedDevice} finish={finish}/></div>
              <div className={ui.previewTag}><ShieldTag finish={finish}/><b>{finish.name}</b><span>Preview finish</span></div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={ui.installSection}>
          <div className={ui.shell}>
            <div className={ui.sectionHeadingCompact}>
              <div><span>INSTALLATION FILM</span><h2>Attach in seconds.</h2></div>
              <p>Peel. Align. Press. Ready.</p>
            </div>
            <div className={ui.installGrid}>
              <div className={ui.film} data-step={filmStep}>
                <div className={ui.filmTop}><span>RADVORA / APPLICATION GUIDE</span><b>00:0{filmStep + 1} / 00:05</b></div>
                <div className={ui.filmScene}>
                  <div className={ui.filmPhone}><span className={ui.filmCamera}/></div>
                  <div className={ui.filmCloth}/>
                  <div className={ui.filmBacking}>PEEL</div>
                  <div className={ui.filmTag}><ShieldTag finish={finishes[0]}/></div>
                  <div className={ui.filmPress}><i/><i/><i/></div>
                  <div className={ui.filmDone}>✓</div>
                </div>
                <div className={ui.filmCaption}><b>{steps[filmStep][0]}</b><p>{steps[filmStep][1]}</p></div>
                <button className={ui.filmControl} onClick={() => setFilmPlaying(v => !v)}>{filmPlaying ? 'Pause' : 'Play'} demo <span>{filmPlaying ? 'Ⅱ' : '▶'}</span></button>
              </div>
              <div className={ui.stepList}>
                {steps.map((step, index) => (
                  <button key={step[0]} className={filmStep === index ? ui.stepActive : ''} onClick={() => { setFilmStep(index); setFilmPlaying(false) }}>
                    <span>{String(index + 1).padStart(2, '0')}</span><div><b>{step[0]}</b><p>{step[1]}</p></div><i>→</i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={ui.assuranceSection}>
          <div className={`${ui.shell} ${ui.assuranceGrid}`}>
            <article className={ui.materialCard}>
              <span>PRODUCT LANGUAGE</span>
              <h2>Premium by design.<br/>Precise by intent.</h2>
              <p>The visual system uses restrained metallic finishes, refined edges and minimal branding so ShieldTag reads as part of the device—not decoration added afterwards.</p>
              <div className={ui.materialRows}>
                <span><b>01</b> Thin layered construction</span>
                <span><b>02</b> Controlled reflectivity</span>
                <span><b>03</b> Device-specific sizing</span>
                <span><b>04</b> Clean RADVORA hierarchy</span>
              </div>
            </article>
            <article className={ui.validationCard}>
              <span>WATER / DURABILITY STATUS</span>
              <h3>No exaggerated claims.</h3>
              <p>RADVORA will publish a water-resistance, scratch, adhesion or removal claim only after the final production version has completed the relevant validation.</p>
              <strong>PERFORMANCE SPECIFICATION UNDER VALIDATION</strong>
              <small>Until an approved rating is published, avoid immersion and prolonged water exposure.</small>
            </article>
          </div>
        </section>

        <section className={ui.faqSection}>
          <div className={`${ui.shell} ${ui.faqGrid}`}>
            <div className={ui.faqIntro}><span>BEFORE YOU BUY</span><h2>Questions answered up front.</h2><p>Clear product guidance should be part of the premium experience, not hidden after purchase.</p><a href="/support">Visit support →</a></div>
            <div className={ui.faqs}>
              <details open><summary>Where should I attach ShieldTag?</summary><p>Use a clean, dry, smooth compatible surface and keep the tag clear of cameras, ports, vents, hinges, buttons, charging contacts and other functional areas.</p></details>
              <details><summary>Is ShieldTag waterproof?</summary><p>No specific waterproof or water-resistance rating is being published until validated testing supports it. Avoid immersion until an approved specification appears.</p></details>
              <details><summary>Can I remove and reapply it?</summary><p>Removal, residue and reapplication characteristics depend on the final adhesive specification. Approved guidance will be published with the production product.</p></details>
              <details><summary>Which devices are supported?</summary><p>The family is being designed for smartphones, tablets, laptops and selected accessories. Exact support should be confirmed through the approved compatibility guide.</p></details>
            </div>
          </div>
        </section>

        <section className={ui.finalSection}>
          <div className={`${ui.shell} ${ui.finalCard}`}>
            <div><span>RADVORA SHIELDTAG</span><h2>Your device should look better with it.</h2><p>Premium identity. Device-matched finishes. A product system designed around the technology you live with.</p></div>
            <div className={ui.finalActions}><a href="/products/shieldtag-pro" className={ui.primary}>Explore ShieldTag <span>→</span></a><a href="/compatibility" className={ui.secondary}>Check compatibility</a></div>
          </div>
        </section>
      </main>

      <footer className={ui.footer}>
        <div className={`${ui.shell} ${ui.footerGrid}`}>
          <div><a href="/" className={ui.brand}><b>RADVORA</b><span>SHIELDTAG</span></a><p>One Shield. Every Device.</p></div>
          <div><b>Product</b><a href="/products">Products</a><a href="/products/shieldtag-pro">ShieldTag</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div>
          <div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/business">Business</a><a href="/contact">Contact</a></div>
          <div><b>Support</b><a href="/support">Help</a><a href="/verify">Verify</a><a href="/warranty">Warranty</a><a href="/account">Account</a></div>
          <div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div>
        </div>
      </footer>
    </div>
  )
}
