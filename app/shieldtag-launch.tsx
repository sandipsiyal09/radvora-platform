'use client'

import { CSSProperties, useEffect, useMemo, useState } from 'react'
import ui from './shieldtag-launch.module.css'

type Finish = {id:string;name:string;base:string;edge:string;accent:string;text:string}
type Device = {id:string;name:string;series:string;tag:string;copy:string;finish:string}

const finishes:Finish[]=[
  {id:'obsidian',name:'Obsidian Black',base:'#070A0F',edge:'#3d4752',accent:'#50E8FF',text:'#F5F8FA'},
  {id:'titanium',name:'Titanium Silver',base:'#AEB8C2',edge:'#F0F4F8',accent:'#BFF7FF',text:'#101820'},
  {id:'graphite',name:'Graphite',base:'#252B32',edge:'#66727F',accent:'#6DEBFF',text:'#F5F8FA'},
  {id:'arctic',name:'Arctic White',base:'#F1F4F7',edge:'#FFFFFF',accent:'#8FEFFF',text:'#14202B'},
  {id:'midnight',name:'Midnight Blue',base:'#102743',edge:'#476B95',accent:'#50A5FF',text:'#F5F8FA'},
  {id:'rose',name:'Rose Gold',base:'#9D655E',edge:'#DDB4AA',accent:'#FFB6A8',text:'#FFF9F7'},
  {id:'forest',name:'Forest Green',base:'#183A30',edge:'#5C8478',accent:'#5FF3C8',text:'#F3FFFA'},
  {id:'champagne',name:'Champagne Gold',base:'#C7AB7A',edge:'#F3DEB5',accent:'#FFE4A4',text:'#211B12'}
]

const devices:Device[]=[
  {id:'phone',name:'Phone',series:'ShieldTag Signature',tag:'SIGNATURE',copy:'Slim, jewel-like identity for modern smartphones.',finish:'obsidian'},
  {id:'tablet',name:'Tablet',series:'ShieldTag Pro',tag:'PRO',copy:'Purposefully scaled for tablets and large-format devices.',finish:'titanium'},
  {id:'laptop',name:'Laptop',series:'ShieldTag Executive',tag:'EXECUTIVE',copy:'A refined plaque-style badge for professional hardware.',finish:'graphite'},
  {id:'mini',name:'Accessories',series:'ShieldTag Mini',tag:'MINI',copy:'Compact formats for earbuds, chargers and small accessories.',finish:'arctic'},
  {id:'utility',name:'Universal',series:'ShieldTag Utility',tag:'UTILITY',copy:'A practical identity format for compatible everyday technology.',finish:'midnight'}
]

const install=[
  ['Clean','Prepare a clean, dry, compatible surface.'],
  ['Peel','Separate the ShieldTag carefully from its backing.'],
  ['Align','Position it away from cameras, vents, ports and controls.'],
  ['Press','Apply even pressure so the badge sits flat.'],
  ['Ready','Inspect the edges and follow approved product guidance.']
]

function LogoMark(){return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>}

function ShieldTag({finish,size='md',label='SHIELDTAG'}:{finish:Finish;size?:'sm'|'md'|'lg';label?:string}){
  const style={'--tag-base':finish.base,'--tag-edge':finish.edge,'--tag-accent':finish.accent,'--tag-text':finish.text} as CSSProperties
  return <div className={`${ui.shieldTag} ${ui[`shieldTag_${size}`]}`} style={style}>
    <div className={ui.tagRim}/><div className={ui.tagFace}><span className={ui.tagLogo}><LogoMark/></span><strong>RADVORA</strong><small>{label}</small><i/></div>
  </div>
}

function DeviceObject({device,finish,hero=false}:{device:Device;finish:Finish;hero?:boolean}){
  return <div className={`${ui.device} ${ui[`device_${device.id}`]} ${hero?ui.deviceHero:''}`}>
    <div className={ui.deviceSurface}>
      <span className={ui.deviceDetail}/><span className={ui.deviceDetail2}/>
      <ShieldTag finish={finish} size={hero?'lg':device.id==='mini'?'sm':'md'} label={device.tag}/>
    </div>
    {device.id==='laptop'&&<div className={ui.laptopBase}/>} 
  </div>
}

function HeroWave({activeFinish}:{activeFinish:Finish}){
  return <div className={ui.heroVisual}>
    <div className={ui.lightSweep}/><div className={ui.waveOne}/><div className={ui.waveTwo}/>
    <div className={`${ui.waveDevice} ${ui.wavePhone}`}><DeviceObject device={devices[0]} finish={activeFinish} hero/></div>
    <div className={`${ui.waveDevice} ${ui.waveTablet}`}><DeviceObject device={devices[1]} finish={activeFinish}/></div>
    <div className={`${ui.waveDevice} ${ui.waveLaptop}`}><DeviceObject device={devices[2]} finish={activeFinish}/></div>
    <div className={`${ui.waveDevice} ${ui.waveMini}`}><DeviceObject device={devices[3]} finish={activeFinish}/></div>
    <div className={ui.visualNote}><span>RADVORA SHIELDTAG</span><b>Premium identity. Modern protection.</b></div>
  </div>
}

function InstallFilm(){
  const [step,setStep]=useState(0)
  const [playing,setPlaying]=useState(true)
  useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setStep(v=>(v+1)%install.length),1800);return()=>window.clearInterval(id)},[playing])
  return <div className={ui.installFilm}>
    <div className={ui.filmTop}><span>RADVORA INSTALLATION FILM</span><button onClick={()=>setPlaying(v=>!v)}>{playing?'PAUSE':'PLAY'}</button></div>
    <div className={ui.filmStage} data-step={step}>
      <div className={ui.filmPhone}/><div className={ui.filmCloth}/><div className={ui.filmBacking}/><div className={ui.filmTag}><LogoMark/><span>RADVORA</span></div><div className={ui.filmFinger}/><div className={ui.filmGlow}/>
    </div>
    <div className={ui.filmSteps}>{install.map(([title],i)=><button key={title} className={i===step?ui.activeStep:''} onClick={()=>{setStep(i);setPlaying(false)}}><span>0{i+1}</span><b>{title}</b></button>)}</div>
    <div className={ui.filmCaption}><b>{install[step][0]}</b><p>{install[step][1]}</p></div>
  </div>
}

export default function ShieldTagLaunch(){
  const [finishId,setFinishId]=useState('obsidian')
  const activeFinish=useMemo(()=>finishes.find(f=>f.id===finishId)??finishes[0],[finishId])

  return <div className={ui.page}>
    <header className={ui.nav}><a href="/" className={ui.brand}><LogoMark/><span><b>RADVORA</b><small>SHIELD FOR A SMARTER TOMORROW</small></span></a><nav><a href="#products">Products</a><a href="#how">How It Works</a><a href="/compatibility">Compatibility</a><a href="/about">About</a><a href="/support">Support</a></nav><a href="#products" className={ui.navCta}>Explore ShieldTag <span>→</span></a></header>

    <main>
      <section className={ui.hero}>
        <div className={ui.heroCopy}><span className={ui.eyebrow}>PREMIUM DEVICE IDENTITY</span><h1>One Shield.<br/><em>Every Device.</em></h1><p>RADVORA ShieldTag is a premium device identity system designed to look native to the technology you already own.</p><div className={ui.heroActions}><a href="#products">Explore Products <span>→</span></a><a href="#how" className={ui.ghostCta}>See How It Works</a></div><div className={ui.heroFeatures}><span>Premium design</span><span>Colour matched</span><span>Simple application</span><span>Device-aware sizing</span></div></div>
        <HeroWave activeFinish={activeFinish}/>
      </section>

      <section id="products" className={ui.productSection}>
        <div className={ui.sectionHead}><span>THE SHIELDTAG FAMILY</span><h2>Designed around the device.<br/>Not forced onto it.</h2><p>Five purpose-built formats share one restrained RADVORA design language.</p></div>
        <div className={ui.productGrid}>{devices.map((device,i)=>{const f=finishes.find(x=>x.id===device.finish)??finishes[0];return <article key={device.id} className={ui.productCard}><div className={ui.productScene}><DeviceObject device={device} finish={f}/></div><div className={ui.productInfo}><span>0{i+1}</span><h3>{device.series}</h3><b>{device.name}</b><p>{device.copy}</p><a href="/products/shieldtag-pro">Explore series →</a></div></article>})}</div>
      </section>

      <section className={ui.colorStudio}>
        <div className={ui.colorCopy}><span>MATCH YOUR DEVICE</span><h2>Blend in.<br/><em>Stand out.</em></h2><p>Choose a finish that visually complements your device or creates a deliberate contrast. Preview colours are design directions until the sellable catalogue is approved.</p></div>
        <div className={ui.colorPreview}><div className={ui.previewDevice}><DeviceObject device={devices[0]} finish={activeFinish} hero/></div><div className={ui.previewMeta}><span>SELECTED FINISH</span><h3>{activeFinish.name}</h3><p>Precision-cut badge with restrained RADVORA branding and signature cyan detail.</p></div></div>
        <div className={ui.finishRow}>{finishes.map(f=><button key={f.id} className={f.id===activeFinish.id?ui.finishSelected:''} onClick={()=>setFinishId(f.id)}><i style={{'--swatch':f.base,'--swatch-edge':f.edge} as CSSProperties}/><span>{f.name}</span></button>)}</div>
      </section>

      <section id="how" className={ui.installSection}>
        <div className={ui.installCopy}><span>ATTACH IN SECONDS</span><h2>Peel. Align.<br/>Press. Ready.</h2><p>A premium product should explain itself before the package is even opened.</p><div className={ui.installList}>{install.map(([title,copy],i)=><div key={title}><span>0{i+1}</span><b>{title}</b><p>{copy}</p></div>)}</div></div>
        <InstallFilm/>
      </section>

      <section className={ui.materialSection}>
        <div className={ui.materialTop}><span>MATERIAL LANGUAGE</span><h2>Machined in spirit.<br/>Minimal by design.</h2><p>RADVORA ShieldTag is presented as a precision identity badge—not a decorative sticker. Final performance claims remain tied to validated production specifications.</p></div>
        <div className={ui.materialGrid}>
          <article><span>01</span><h3>Refined edges</h3><p>Chamfered geometry and restrained proportions create a hardware-like visual language.</p></article>
          <article><span>02</span><h3>Controlled reflectivity</h3><p>Matte, metallic and satin directions avoid fake chrome and excessive visual noise.</p></article>
          <article><span>03</span><h3>Device-aware placement</h3><p>Designed to sit clear of cameras, vents, buttons, hinges and charging contacts.</p></article>
          <article><span>04</span><h3>Performance under validation</h3><p>No waterproof, residue-free or reusability claim is published until testing supports it.</p></article>
        </div>
      </section>

      <section className={ui.packagingSection}>
        <div className={ui.packagingVisual}><div className={ui.packBox}><div className={ui.packLid}><LogoMark/><b>RADVORA</b><span>SHIELDTAG SIGNATURE</span><small>{activeFinish.name.toUpperCase()}</small></div><div className={ui.packTray}><ShieldTag finish={activeFinish} size="lg"/><p>Peel. Align. Press. Ready.</p></div></div></div>
        <div className={ui.packagingCopy}><span>PACKAGING / PRODUCT EXPERIENCE</span><h2>Unbox it like premium technology.</h2><p>A slim precision-fold presentation, clean product cradle, minimal front face and installation guidance create the right first impression.</p><div><b>Front</b><p>RADVORA · ShieldTag Signature · finish name</p></div><div><b>Inside</b><p>ShieldTag cradle · application card · installation guide</p></div><div><b>Back</b><p>Variant, care, application, batch and verified statutory information only.</p></div></div>
      </section>

      <section className={ui.faqSection}>
        <div><span>QUESTIONS / ANSWERED UP FRONT</span><h2>Clarity builds confidence.</h2></div>
        <div className={ui.faqList}><details open><summary>Is ShieldTag waterproof?</summary><p>A specific water-resistance rating will only be published after the final production version has completed the required validation. Until then, avoid immersion and prolonged water exposure.</p></details><details><summary>Will ShieldTag damage my device?</summary><p>Use only on compatible clean, dry, smooth surfaces. Final removal guidance depends on the approved adhesive system and surface material.</p></details><details><summary>Can I remove and reapply it?</summary><p>Removal and reapplication characteristics will be published with the validated production specification.</p></details><details><summary>What devices are supported?</summary><p>The family is designed for smartphones, tablets, laptops and selected accessories. Exact compatibility should be confirmed through the approved device guide.</p></details></div>
      </section>

      <section className={ui.finalCta}><span>RADVORA SHIELDTAG</span><h2>That looks like it belongs on the device.</h2><p>That is the standard every ShieldTag design should meet.</p><div><a href="/products/shieldtag-pro">Explore ShieldTag <span>→</span></a><a href="/compatibility" className={ui.ghostCta}>Check Compatibility</a></div></section>
    </main>

    <footer className={ui.footer}><a href="/" className={ui.brand}><LogoMark/><span><b>RADVORA</b><small>ONE SHIELD. EVERY DEVICE.</small></span></a><div><a href="/products">Products</a><a href="/support">Support</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div><p>Premium device identity. India-first experience.</p></footer>
  </div>
}
