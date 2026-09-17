'use client'

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import ui from './device-shield-showcase.module.css'

type Finish = { id:string; name:string; base:string; edge:string; glow:string; text:string }
type Product = { id:string; name:string; detail:string; finish:string; x:number; y:number; z:number; rotate:number; scale:number; delay:number }

const finishes: Finish[] = [
  { id:'obsidian', name:'Obsidian Black', base:'#070a0f', edge:'#6d7782', glow:'#50e8ff', text:'#f6fbff' },
  { id:'titanium', name:'Titanium Silver', base:'#aeb8c2', edge:'#f0f4f8', glow:'#c1f7ff', text:'#0e151d' },
  { id:'graphite', name:'Graphite Gray', base:'#323943', edge:'#8b98a5', glow:'#72dfff', text:'#f7fbff' },
  { id:'midnight', name:'Midnight Blue', base:'#102743', edge:'#587ca6', glow:'#398fff', text:'#f6fbff' },
  { id:'arctic', name:'Arctic White', base:'#eef2f5', edge:'#ffffff', glow:'#8ff7ff', text:'#15202b' },
  { id:'rose', name:'Rose Gold', base:'#9d655e', edge:'#dcb1a5', glow:'#ffc0b8', text:'#fff9f6' },
  { id:'forest', name:'Forest Green', base:'#183a30', edge:'#628f81', glow:'#5ff3c8', text:'#effff9' },
  { id:'red', name:'Deep Red', base:'#5d111a', edge:'#ae505b', glow:'#ff5a6d', text:'#fff7f8' },
]

const products: Product[] = [
  { id:'phone', name:'Smartphone', detail:'Pocket flagship', finish:'obsidian', x:8, y:61, z:95, rotate:-9, scale:1.08, delay:0 },
  { id:'tablet', name:'Tablet', detail:'Large-format device', finish:'graphite', x:23, y:36, z:56, rotate:-5, scale:.92, delay:-.8 },
  { id:'laptop', name:'Laptop', detail:'Desk + travel setup', finish:'midnight', x:45, y:24, z:28, rotate:3, scale:1.02, delay:-1.6 },
  { id:'earbuds', name:'Earbuds', detail:'Compact carry case', finish:'arctic', x:67, y:43, z:45, rotate:7, scale:.8, delay:-2.4 },
  { id:'power', name:'Power bank', detail:'Portable charging', finish:'forest', x:79, y:58, z:63, rotate:8, scale:.88, delay:-3.2 },
  { id:'tracker', name:'Tracker', detail:'Small accessory', finish:'rose', x:90, y:42, z:40, rotate:-6, scale:.72, delay:-4 },
  { id:'bottle', name:'Bottle', detail:'Everyday accessory', finish:'titanium', x:96, y:64, z:18, rotate:6, scale:.7, delay:-4.8 },
]

const demoSteps = [
  { title:'Peel', copy:'Lift the ShieldTag from its backing without touching the adhesive area more than necessary.' },
  { title:'Align', copy:'Position it on a clean, dry, flat surface away from cameras, vents, ports, hinges and controls.' },
  { title:'Press', copy:'Press evenly across the face and edges so the tag sits flat against the device or case.' },
  { title:'Ready', copy:'Check the edges, then use the device normally within the approved product guidance.' },
]

function LogoMark(){
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 9h43L39 24H24l-5 6h25L27 50l-7-8 8-9H13L7 26l15-17Z" fill="currentColor"/><path d="M31 24h14L34 36l-8-8 5-4Z" fill="currentColor" opacity=".6"/></svg>
}

function Shield({ finish, small=false }:{ finish:Finish; small?:boolean }){
  const style = {'--finish-base':finish.base,'--finish-edge':finish.edge,'--finish-glow':finish.glow,'--finish-text':finish.text} as CSSProperties
  return <div className={`${ui.shield} ${small?ui.shieldSmall:''}`} style={style} aria-label={`RADVORA ShieldTag in ${finish.name}`}>
    <div className={ui.shieldEdge}/><div className={ui.shieldFace}><span className={ui.shieldLogo}><LogoMark/></span><strong>RADVORA</strong><small>SHIELDTAG</small><i/><span/></div>
  </div>
}

function ProductRender({ product, finish }:{ product:Product; finish:Finish }){
  const style = {'--px':`${product.x}%`,'--py':`${product.y}%`,'--pz':`${product.z}px`,'--pr':`${product.rotate}deg`,'--ps':product.scale,'--pd':`${product.delay}s`} as CSSProperties
  return <button className={ui.waveProduct} data-product={product.id} style={style} type="button" aria-label={`${product.name} with RADVORA ShieldTag`}>
    <span className={ui.productGlow}/><span className={ui.productBody}><span className={ui.productDetails}/><Shield finish={finish} small={product.id==='tracker'||product.id==='bottle'}/><span className={ui.productBase}/></span>
    <span className={ui.productCaption}><b>{product.name}</b><small>{product.detail}</small></span>
  </button>
}

function InstallationDemo(){
  const [step,setStep]=useState(0)
  const [playing,setPlaying]=useState(true)
  useEffect(()=>{ if(!playing) return; const timer=window.setInterval(()=>setStep(v=>(v+1)%demoSteps.length),1900); return()=>window.clearInterval(timer)},[playing])
  return <section className={ui.demoSection}>
    <div className={ui.demoCopy}><span>INSTALLATION / SAMPLE MOTION DEMO</span><h3>Peel. Align. Press. Ready.</h3><p>A short animated walkthrough shows the correct installation sequence before a customer opens the package.</p><button type="button" onClick={()=>setPlaying(v=>!v)}>{playing?'Pause demo':'Play demo'} <i>{playing?'Ⅱ':'▶'}</i></button></div>
    <div className={ui.demoPlayer} data-step={step} aria-label={`Installation demo: ${demoSteps[step].title}`}>
      <div className={ui.demoHeader}><span>RADVORA INSTALLATION FILM</span><b>00:0{step+1} / 00:04</b></div>
      <div className={ui.demoStage}>
        <div className={ui.demoPhone}><span/><span/><span/></div>
        <div className={ui.demoBacking}><span>PEEL</span></div>
        <div className={ui.demoTag}><LogoMark/><b>RADVORA</b></div>
        <div className={ui.demoPress}><i/><i/><i/></div>
        <div className={ui.demoReady}>✓</div>
      </div>
      <div className={ui.demoTimeline}>{demoSteps.map((item,index)=><button type="button" key={item.title} className={index===step?ui.demoActive:''} onClick={()=>{setStep(index);setPlaying(false)}}><i/><span>{String(index+1).padStart(2,'0')}</span><b>{item.title}</b></button>)}</div>
      <div className={ui.demoCaption}><b>{demoSteps[step].title}</b><p>{demoSteps[step].copy}</p></div>
    </div>
  </section>
}

export default function DeviceShieldShowcase(){
  const [matchMode,setMatchMode]=useState(true)
  const [finishId,setFinishId]=useState('obsidian')
  const waveRef=useRef<HTMLDivElement>(null)
  const selected=useMemo(()=>finishes.find(f=>f.id===finishId)??finishes[0],[finishId])
  const finishFor=(product:Product)=>matchMode?(finishes.find(f=>f.id===product.finish)??finishes[0]):selected

  const move=(event:React.PointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect(); const x=(event.clientX-rect.left)/rect.width-.5; const y=(event.clientY-rect.top)/rect.height-.5
    waveRef.current?.style.setProperty('--wave-rx',`${-y*7}deg`); waveRef.current?.style.setProperty('--wave-ry',`${x*10}deg`)
  }

  return <section className={ui.section}>
    <div className={ui.ambientA}/><div className={ui.ambientB}/><div className={ui.shell}>
      <div className={ui.heading}><span className={ui.kicker}>SHIELDTAG / IMMERSIVE DEVICE WAVE</span><div><h2>One Shield.<em> Every Device.</em></h2><p>See RADVORA ShieldTag move through a single 3D wave of phones, tablets, laptops and everyday accessories—with finishes that can visually match the device.</p></div><div className={ui.headingActions}><a href="/products/shieldtag-pro">Explore ShieldTag <span>→</span></a><button type="button" onClick={()=>setMatchMode(true)}>Auto-match colors</button></div></div>

      <div className={ui.waveStage} onPointerMove={move} onPointerLeave={()=>{waveRef.current?.style.setProperty('--wave-rx','0deg');waveRef.current?.style.setProperty('--wave-ry','0deg')}}>
        <div className={ui.stageTop}><span>LIVE 3D PRODUCT WAVE</span><b>{matchMode?'DEVICE-MATCHED FINISHES':selected.name.toUpperCase()}</b></div>
        <svg className={ui.energyWave} viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="waveGlow" x1="0" x2="1"><stop offset="0" stopColor="#59e8ff" stopOpacity="0"/><stop offset=".2" stopColor="#59e8ff"/><stop offset=".55" stopColor="#6f7cff"/><stop offset=".8" stopColor="#66f3d5"/><stop offset="1" stopColor="#66f3d5" stopOpacity="0"/></linearGradient></defs><path d="M-40 405 C150 570 245 245 435 322 S720 535 890 330 S1080 145 1240 238"/><path d="M-40 420 C160 585 250 270 440 340 S720 550 900 345 S1090 160 1240 252"/><path d="M-40 390 C145 548 230 230 430 305 S710 520 875 315 S1070 130 1240 225"/></svg>
        <div className={ui.waveParticles} aria-hidden="true">{Array.from({length:18}).map((_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}</div>
        <div ref={waveRef} className={ui.waveProducts}>{products.map(product=><ProductRender key={product.id} product={product} finish={finishFor(product)}/>)}</div>
        <div className={ui.waveLegend}><span><i/>PHONE</span><span><i/>TABLET</span><span><i/>LAPTOP</span><span><i/>AUDIO</span><span><i/>POWER</span><span><i/>ACCESSORIES</span></div>
      </div>

      <div className={ui.finishPanel}><div><span>COLOR STUDIO</span><h3>Match the device. Or make the ShieldTag stand out.</h3><p>Color selections shown here are visual previews until corresponding sellable catalog variants are approved and configured.</p></div><div className={ui.finishGrid}>{finishes.map(item=><button type="button" key={item.id} className={!matchMode&&item.id===selected.id?ui.finishActive:''} onClick={()=>{setFinishId(item.id);setMatchMode(false)}}><span style={{'--swatch':item.base,'--swatch-edge':item.edge,'--swatch-glow':item.glow} as CSSProperties}><i/></span><b>{item.name}</b></button>)}</div><button type="button" className={matchMode?ui.matchActive:ui.matchButton} onClick={()=>setMatchMode(true)}>Smart Match <span>{matchMode?'ON':'OFF'}</span></button></div>

      <InstallationDemo/>

      <section className={ui.guidanceSection}>
        <article className={ui.statusCard}><span>WATER RESISTANCE</span><div className={ui.dropIcon}>◌</div><h3>Waterproof? We will only say it when testing proves it.</h3><p>RADVORA is not publishing a waterproof rating for ShieldTag until validated product testing supports a specific claim. Until an approved rating appears on the product specification, avoid immersion and prolonged water exposure.</p><b>STATUS · RATING NOT YET PUBLISHED</b></article>
        <div className={ui.faq}><span>CUSTOMER QUESTIONS / ANSWERED UP FRONT</span>
          <details open><summary>Where should I attach ShieldTag?</summary><p>Use a clean, dry, smooth surface. Keep it clear of cameras, vents, ports, hinges, buttons, charging contacts and other functional areas.</p></details>
          <details><summary>Can I use it on a phone case or laptop shell?</summary><p>Material compatibility depends on the final adhesive system and the surface finish. Use the approved compatibility guide for the exact device or case material.</p></details>
          <details><summary>Can I remove and reapply it?</summary><p>Do not assume reusability or residue-free removal until the final adhesive specification is validated. The product page will show the approved removal guidance.</p></details>
          <details><summary>How do I choose a color?</summary><p>Use Smart Match for a coordinated finish or select any preview color manually. Actual purchasable colors will come from the approved catalog.</p></details>
        </div>
      </section>
    </div>
  </section>
}
