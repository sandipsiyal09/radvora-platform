'use client'

import { useEffect, useRef, useState } from 'react'
import fx from './immersive-experience.module.css'

const hotspots = [
  { id: 'identity', label: 'Serialized identity', detail: 'Authenticity is checked against the server-backed verification record.' },
  { id: 'evidence', label: 'Evidence state', detail: 'Public claim language stays separated from prototype or pending review states.' },
  { id: 'compatibility', label: 'Compatibility context', detail: 'Known combinations can be published while unknown combinations remain unknown.' },
]

const verificationSteps = [
  ['01', 'Serial input', 'Customer submits the supported product identifier.'],
  ['02', 'Server validation', 'The verification route checks the authoritative product record.'],
  ['03', 'Authenticity state', 'The response describes authenticity without implying scientific performance.'],
  ['04', 'Support context', 'Eligible records can connect to warranty and customer-care history.'],
]

const storyScenes = [
  {
    index: '01',
    eyebrow: 'PRODUCT REVEAL',
    title: 'A product should feel tangible before a claim is ever made.',
    copy: 'The interface uses material depth, lighting, spatial movement and direct manipulation to make the product experience richer without turning presentation into evidence.',
  },
  {
    index: '02',
    eyebrow: 'SIGNAL LANGUAGE',
    title: 'Motion explains relationships instead of manufacturing certainty.',
    copy: 'Animated fields, waveforms and spectrum-style visuals are deliberately illustrative. They communicate RF-oriented context while avoiding fabricated measurement values.',
  },
  {
    index: '03',
    eyebrow: 'TRUST SYSTEM',
    title: 'Verification, compatibility, evidence and support stay separate.',
    copy: 'Each system has its own record and meaning. The experience connects them visually while preserving those boundaries in the product and backend architecture.',
  },
]

function ProductModel() {
  const modelRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [exploded, setExploded] = useState(false)

  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = modelRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const nx = (event.clientX - rect.left) / rect.width - 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5
    node.style.setProperty('--rx', `${(-ny * 15).toFixed(2)}deg`)
    node.style.setProperty('--ry', `${(nx * 19).toFixed(2)}deg`)
  }

  return (
    <div className={fx.productExperience}>
      <div className={fx.productViewport} onPointerMove={tilt} onPointerLeave={() => {
        modelRef.current?.style.setProperty('--rx', '-8deg')
        modelRef.current?.style.setProperty('--ry', '-16deg')
      }}>
        <div className={fx.viewportGrid} />
        <div className={fx.viewportGlow} />
        <div ref={modelRef} className={`${fx.productModel} ${exploded ? fx.exploded : ''}`}>
          <div className={`${fx.modelLayer} ${fx.layerBack}`} />
          <div className={`${fx.modelLayer} ${fx.layerMid}`} />
          <div className={`${fx.modelLayer} ${fx.layerFront}`}>
            <div className={fx.brandGlyph}>A</div>
            <strong>RADVORA</strong>
            <small>SHIELDTAG PRO</small>
          </div>
          <div className={fx.modelScan} />
        </div>
        {hotspots.map((hotspot, index) => (
          <button
            key={hotspot.id}
            className={`${fx.hotspot} ${active === index ? fx.hotspotActive : ''} ${fx[`hotspot${index + 1}` as keyof typeof fx]}`}
            onClick={() => setActive(index)}
            aria-label={`Show ${hotspot.label}`}
          >
            <span>{index + 1}</span>
          </button>
        ))}
        <div className={fx.orbitField}><i/><i/><i/></div>
        <div className={fx.productControls}>
          <button onClick={() => setExploded((value) => !value)}>{exploded ? 'Collapse layers' : 'Explode view'}</button>
          <span>Move pointer to inspect depth</span>
        </div>
      </div>
      <div className={fx.hotspotReadout}>
        <span>HOTSPOT {String(active + 1).padStart(2, '0')}</span>
        <h3>{hotspots[active].label}</h3>
        <p>{hotspots[active].detail}</p>
        <div className={fx.readoutRule}><i /></div>
        <small>INTERACTIVE PRODUCT CONTEXT · NOT A PERFORMANCE CLAIM</small>
      </div>
    </div>
  )
}

function VerificationJourney() {
  return (
    <div className={fx.verificationJourney}>
      <div className={fx.verificationBeam} />
      {verificationSteps.map(([number, title, body], index) => (
        <div className={fx.verificationStep} key={number} style={{ '--delay': `${index * 120}ms` } as React.CSSProperties}>
          <div className={fx.verificationNode}><span>{number}</span><i /></div>
          <div><b>{title}</b><p>{body}</p></div>
        </div>
      ))}
    </div>
  )
}

function SignalField() {
  const bars = [22,31,47,66,45,78,52,87,61,94,57,75,42,83,54,71,39,64,48,80,58,90,63,73,46,68,51,76,44,59]
  return (
    <div className={fx.signalField} role="img" aria-label="Illustrative animated RF-style signal field">
      <div className={fx.signalHalo}><i/><i/><i/><i/></div>
      <svg className={fx.waveform} viewBox="0 0 800 260" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="immersiveWave" x1="0" x2="1"><stop offset="0" stopColor="#5379ff" stopOpacity="0"/><stop offset=".45" stopColor="#77c9ff"/><stop offset=".62" stopColor="#84f1df"/><stop offset="1" stopColor="#84f1df" stopOpacity="0"/></linearGradient>
        </defs>
        {[0,1,2,3].map((n) => <path key={n} d={`M0 ${132+n*4} C90 ${34+n*12}, 160 ${226-n*10}, 250 ${126+n*2} S430 ${42+n*9}, 520 ${128-n*3} S680 ${212-n*11}, 800 ${130+n}`} fill="none" stroke="url(#immersiveWave)" strokeWidth={1.2+n*.5} opacity={.28+n*.16}/>)}
      </svg>
      <div className={fx.signalBars}>{bars.map((height,index)=><i key={`${height}-${index}`} style={{height:`${height}%`,animationDelay:`${-index*.055}s`}} />)}</div>
      <div className={fx.signalCaption}><span>ILLUSTRATIVE FIELD</span><b>No unverified performance number is displayed</b></div>
    </div>
  )
}

function TrustDashboard() {
  const cards = [
    ['SERIAL', 'Authenticity', 'Server-backed verification'],
    ['EVIDENCE', 'Claim state', 'Human-controlled approval'],
    ['DEVICE', 'Compatibility', 'Known / limited / unknown'],
    ['SUPPORT', 'Service context', 'Warranty and care history'],
  ]
  return (
    <div className={fx.trustDashboard}>
      <div className={fx.dashboardTop}><span>RADVORA TRUST SYSTEM</span><i>LIVE ARCHITECTURE VIEW</i></div>
      <div className={fx.dashboardRadar}><div className={fx.radarSweep}/><i/><i/><i/><i/></div>
      <div className={fx.dashboardCards}>{cards.map(([code,title,body],index)=><article key={code} style={{'--cardDelay':`${index*90}ms`} as React.CSSProperties}><span>{code}</span><b>{title}</b><p>{body}</p><i/></article>)}</div>
    </div>
  )
}

export default function ImmersiveExperience() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-immersive-reveal]'))
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add(fx.shown)
    }), { threshold: .16, rootMargin: '0px 0px -8% 0px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={rootRef} className={fx.experience}>
      <div className={fx.sectionGlowA}/><div className={fx.sectionGlowB}/>
      <div className={fx.shell}>
        <div className={`${fx.intro} ${fx.reveal}`} data-immersive-reveal>
          <span>IMMERSIVE PRODUCT LAB / 01</span>
          <h2>See the product. Inspect the system. Follow the evidence.</h2>
          <p>This layer turns RADVORA into a cinematic product experience using spatial depth, interactive hotspots, scroll storytelling and data visualization while preserving the distinction between visual storytelling and verified product claims.</p>
        </div>
        <div className={`${fx.reveal} ${fx.delay1}`} data-immersive-reveal><ProductModel /></div>
      </div>

      <div className={fx.storyRail}>
        <div className={fx.storySticky}>
          <div className={fx.storyBackdrop}><i/><i/><i/></div>
          <div className={fx.storyCopy}>
            <span>SCROLL STORY / 02</span>
            <h2>Three scenes. One controlled product narrative.</h2>
          </div>
          <div className={fx.storyCards}>{storyScenes.map((scene,index)=><article key={scene.index} className={`${fx.storyCard} ${index===1?fx.storyCardMiddle:''}`}><span>{scene.index} · {scene.eyebrow}</span><h3>{scene.title}</h3><p>{scene.copy}</p><i/></article>)}</div>
        </div>
      </div>

      <div className={`${fx.shell} ${fx.systemGrid}`}>
        <article className={`${fx.systemPanel} ${fx.reveal}`} data-immersive-reveal>
          <div className={fx.panelHead}><span>VERIFY / 03</span><b>Serial validation journey</b></div>
          <VerificationJourney />
          <a href="/verify">Open product verification →</a>
        </article>
        <article className={`${fx.systemPanel} ${fx.reveal} ${fx.delay1}`} data-immersive-reveal>
          <div className={fx.panelHead}><span>RF VISUAL / 04</span><b>Animated signal language</b></div>
          <SignalField />
          <a href="/research">Explore evidence model →</a>
        </article>
      </div>

      <div className={`${fx.shell} ${fx.dashboardSection}`}>
        <div className={`${fx.dashboardCopy} ${fx.reveal}`} data-immersive-reveal>
          <span>TRUST DASHBOARD / 05</span>
          <h2>Premium visuals are strongest when the underlying states remain explicit.</h2>
          <p>The dashboard is intentionally qualitative. Until real production metrics are approved, it visualizes system categories instead of inventing customer, product, testing or readiness counts.</p>
          <div className={fx.dashboardLinks}><a href="/compatibility">Compatibility →</a><a href="/support">Support →</a><a href="/research">Research →</a></div>
        </div>
        <div className={`${fx.reveal} ${fx.delay1}`} data-immersive-reveal><TrustDashboard /></div>
      </div>
    </section>
  )
}
