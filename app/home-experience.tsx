'use client'

import { useEffect, useRef, useState } from 'react'
import ImmersiveExperience from './immersive-experience'
import DeviceShieldShowcase from './device-shield-showcase'
import ui from './home-experience.module.css'

const nav = [
  ['Products','/products'],['Science','/research'],['Labs','/labs'],['Business','/business'],['About','/about'],['Account','/account'],
]

const ecosystemNodes = [
  { x: 50, y: 50, label: 'RADVORA', core: true },
  { x: 17, y: 24, label: 'PHONE' },
  { x: 82, y: 19, label: 'TABLET' },
  { x: 88, y: 66, label: 'LAPTOP' },
  { x: 62, y: 86, label: 'ACCESSORY' },
  { x: 15, y: 71, label: 'DEVICE' },
]

function HeroProduct() {
  const model = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const rotation = useRef({x:-9,y:-20})

  const apply = () => {
    if (model.current) model.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
  }

  useEffect(() => apply(), [])

  return (
    <div className={ui.heroProduct} onPointerMove={(event) => {
      if (drag.current) {
        rotation.current.y += event.movementX * .3
        rotation.current.x = Math.max(-26,Math.min(26,rotation.current.x-event.movementY*.18))
      } else {
        const rect=event.currentTarget.getBoundingClientRect()
        rotation.current.y=((event.clientX-rect.left)/rect.width-.5)*26
        rotation.current.x=-7-((event.clientY-rect.top)/rect.height-.5)*14
      }
      apply()
    }} onPointerLeave={()=>{drag.current=false;rotation.current={x:-9,y:-20};apply()}}>
      <div className={ui.heroSphere}/>
      <div className={`${ui.heroOrbit} ${ui.orbitA}`}/><div className={`${ui.heroOrbit} ${ui.orbitB}`}/><div className={`${ui.heroOrbit} ${ui.orbitC}`}/>
      <div ref={model} className={ui.heroDisc} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);drag.current=true}} onPointerUp={()=>{drag.current=false}}>
        <div className={ui.heroDiscBack}/><div className={ui.heroDiscMid}/><div className={ui.heroDiscFront}><div className={ui.heroGlyph}>A</div><b>RADVORA</b><span>SHIELDTAG PRO</span><i/></div>
      </div>
      <div className={`${ui.floatingTag} ${ui.tagOne}`}><span>01</span><b>VERIFIED IDENTITY</b><small>Server-backed serial context</small></div>
      <div className={`${ui.floatingTag} ${ui.tagTwo}`}><span>02</span><b>EVIDENCE-GATED</b><small>Human approval before claims</small></div>
      <div className={`${ui.floatingTag} ${ui.tagThree}`}><span>03</span><b>STATUS-AWARE</b><small>Compatibility stays explicit</small></div>
      <div className={ui.heroHint}>MOVE · DRAG · INSPECT</div>
    </div>
  )
}

function CompatibilityMap() {
  return <div className={ui.compatibilityMap}>
    <svg viewBox="0 0 100 100" role="img" aria-label="Illustrative device compatibility ecosystem">
      <defs><linearGradient id="compatLine" x1="0" x2="1"><stop offset="0" stopColor="#697cff"/><stop offset="1" stopColor="#7cebdd"/></linearGradient></defs>
      <circle cx="50" cy="50" r="30" className={ui.compatRing}/><circle cx="50" cy="50" r="42" className={`${ui.compatRing} ${ui.compatOuter}`}/>
      {ecosystemNodes.slice(1).map(n=><line key={n.label} x1="50" y1="50" x2={n.x} y2={n.y} className={ui.compatLine}/>)}
      {ecosystemNodes.map(n=><g key={n.label} className={n.core?ui.compatCore:ui.compatNode}><circle cx={n.x} cy={n.y} r={n.core?7:3.3}/><text x={n.x} y={n.y+(n.core?12:7)} textAnchor="middle">{n.label}</text></g>)}
    </svg>
    <div className={ui.compatLegend}><span><i/>Reviewed relationship</span><span><i/>Unknown remains unknown</span></div>
  </div>
}

function TransitionStrip(){
  const labels=['SERIALIZED VERIFICATION','EVIDENCE BEFORE MARKETING','INTERACTIVE PRODUCT DEPTH','COMPATIBILITY WITH CONTEXT','HUMAN APPROVAL GATES','TRACEABLE SUPPORT']
  return <div className={ui.transitionStrip} aria-hidden="true"><div>{[...labels,...labels].map((label,index)=><span key={`${label}-${index}`}><i/>{label}</span>)}</div></div>
}

export default function HomeExperience(){
  const [menu,setMenu]=useState(false)
  const [loaded,setLoaded]=useState(false)

  useEffect(()=>{
    const root=document.documentElement
    let target=window.scrollY
    let current=target
    let raf=0
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const move=(event:PointerEvent)=>{
      root.style.setProperty('--hx',`${event.clientX}px`)
      root.style.setProperty('--hy',`${event.clientY}px`)
      root.style.setProperty('--pnx',`${event.clientX/window.innerWidth-.5}`)
      root.style.setProperty('--pny',`${event.clientY/window.innerHeight-.5}`)
    }
    const scroll=()=>{target=window.scrollY;root.style.setProperty('--scrollProgress',`${Math.min(1,target/Math.max(1,document.documentElement.scrollHeight-window.innerHeight))}`)}
    const animate=()=>{current+= (target-current)*.085;root.style.setProperty('--smoothScroll',`${current}`);raf=requestAnimationFrame(animate)}
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('scroll',scroll,{passive:true});scroll();if(!reduced) raf=requestAnimationFrame(animate)
    const timer=window.setTimeout(()=>setLoaded(true),120)
    return()=>{window.clearTimeout(timer);cancelAnimationFrame(raf);window.removeEventListener('pointermove',move);window.removeEventListener('scroll',scroll)}
  },[])

  return <div className={`${ui.page} ${loaded?ui.loaded:''}`}>
    <div className={ui.entryCurtain}><div><span>RADVORA</span><i/></div></div>
    <div className={ui.progressRail}><i/></div>
    <div className={ui.cursorGlow}/><div className={ui.ambientOne}/><div className={ui.ambientTwo}/><div className={ui.depthGrid}/>

    <header className={ui.nav}><div className={`${ui.shell} ${ui.navInner}`}>
      <a href="/" className={ui.brand}><b>RADVORA</b><span>TECHNOLOGIES</span></a>
      <nav className={`${ui.links} ${menu?ui.linksOpen:''}`}>{nav.map(([label,href])=><a key={label} href={href} onClick={()=>setMenu(false)}>{label}</a>)}</nav>
      <div className={ui.navCtas}><a href="/verify" className={ui.textCta}>VERIFY PRODUCT</a><a href="/products/shieldtag-pro" className={ui.mainCta}>EXPLORE SHIELDTAG <span>↗</span></a></div>
      <button className={ui.menu} onClick={()=>setMenu(v=>!v)} aria-label="Toggle navigation">☰</button>
    </div></header>

    <main data-editorial-product-rails="home">
      <section className={`${ui.shell} ${ui.hero}`}>
        <div className={ui.heroCopy}>
          <div className={ui.eyebrow}><span/>RADVORA · FUTURE PRODUCT SYSTEM</div>
          <h1>Technology You Can <em>Measure.</em></h1>
          <h2>Built with evidence. Presented with precision.</h2>
          <p>Premium RF-focused accessories and digital-wellness technology presented through spatial interaction, transparent evidence states, serialized verification and explicit compatibility context.</p>
          <div className={ui.heroActions}><a href="/products/shieldtag-pro" className={ui.heroPrimary}>Enter ShieldTag <span>→</span></a><a href="/research" className={ui.heroSecondary}>See the evidence model ↗</a></div>
          <div className={ui.heroTrust}><div><i/>Serialized verification</div><div><i/>Evidence-gated claims</div><div><i/>Compatibility clarity</div></div>
        </div>
        <div className={ui.heroVisual}><div className={ui.visualLabel}><span>INTERACTIVE SPATIAL OBJECT</span><b>01 / HERO</b></div><HeroProduct/></div>
        <div className={ui.scrollPrompt}><span>SCROLL TO ENTER</span><i/></div>
      </section>

      <TransitionStrip/>
      <DeviceShieldShowcase/>
      <ImmersiveExperience/>

      <section className={`${ui.shell} ${ui.compatSection}`}>
        <div className={ui.compatCopy}><span>DEVICE ECOSYSTEM / 06</span><h2>Compatibility should be visible, not buried in fine print.</h2><p>The ecosystem view connects product and device categories visually while preserving the actual compatibility state in the underlying product records.</p><div><a href="/compatibility">Check compatibility →</a><a href="/products">Browse products →</a></div></div>
        <div className={ui.compatVisual}><div className={ui.panelTop}><span>RELATIONSHIP NETWORK</span><b>ILLUSTRATIVE VIEW</b></div><CompatibilityMap/></div>
      </section>

      <section className={ui.finalScene}>
        <div className={ui.finalRings}><i/><i/><i/><i/></div><div className={ui.finalLight}/>
        <div className={`${ui.shell} ${ui.finalInner}`}><span>RADVORA / INDIA-FIRST EXPERIENCE</span><h2>Advanced enough to feel futuristic. Controlled enough to remain credible.</h2><p>Explore products, verification, compatibility, research and business programs through one immersive system.</p><div><a href="/products" className={ui.heroPrimary}>Explore products →</a><a href="/business" className={ui.heroSecondary}>Business enquiries</a></div></div>
      </section>
    </main>

    <footer className={ui.footer}><div className={`${ui.shell} ${ui.footerGrid}`}>
      <div><a href="/" className={ui.brand}><b>RADVORA</b><span>TECHNOLOGIES</span></a><p>Technology you can measure.</p></div>
      <div><b>Product</b><a href="/products">Products</a><a href="/verify">Verify</a><a href="/compatibility">Compatibility</a><a href="/installation">Installation</a></div>
      <div><b>Company</b><a href="/about">About</a><a href="/research">Research</a><a href="/labs">Labs</a><a href="/business">Business</a></div>
      <div><b>Customer</b><a href="/account">Account</a><a href="/support">Support</a><a href="/warranty">Warranty</a><a href="/cart">Cart</a></div>
      <div><b>Legal</b><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/returns">Returns</a><a href="/shipping">Shipping</a></div>
    </div></footer>
  </div>
}
