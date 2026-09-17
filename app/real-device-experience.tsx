'use client'

import { CSSProperties, useEffect, useMemo, useState } from 'react'
import ui from './real-device-experience.module.css'

type Finish={id:string;name:string;base:string;edge:string;accent:string;text:string}
type DeviceExample={id:string;brand:string;name:string;category:string;image:string;source:string;tagClass:string;fit:'contain'|'cover';tone:string}
type Family={id:string;name:string;for:string;copy:string;deviceId:string;label:string}

const finishes:Finish[]=[
  {id:'obsidian',name:'Obsidian Black',base:'#070A0F',edge:'#434E5A',accent:'#50E8FF',text:'#F7FAFC'},
  {id:'titanium',name:'Titanium Silver',base:'#AEB8C2',edge:'#F1F5F8',accent:'#BFF7FF',text:'#111820'},
  {id:'graphite',name:'Graphite Grey',base:'#252B32',edge:'#697684',accent:'#6DEBFF',text:'#F7FAFC'},
  {id:'arctic',name:'Arctic White',base:'#EFF3F6',edge:'#FFFFFF',accent:'#8FEFFF',text:'#14202B'},
  {id:'midnight',name:'Midnight Blue',base:'#102743',edge:'#496F9A',accent:'#50A5FF',text:'#F7FAFC'},
  {id:'rose',name:'Rose Gold',base:'#9D655E',edge:'#DDB4AA',accent:'#FFB8AA',text:'#FFF9F7'},
  {id:'forest',name:'Forest Green',base:'#183A30',edge:'#5D877A',accent:'#60F0C9',text:'#F3FFFA'},
  {id:'champagne',name:'Champagne Gold',base:'#C7AB7A',edge:'#F1DDB7',accent:'#FFE4A4',text:'#211B12'}
]

const devices:DeviceExample[]=[
  {id:'iphone',brand:'Apple',name:'iPhone 17',category:'Smartphone',image:'https://www.apple.com/newsroom/images/2025/09/apple-debuts-iphone-17/geo/article/Apple-iPhone-17-hero-250909_inline.jpg.large.jpg',source:'https://www.apple.com/in/newsroom/2025/09/apple-introduces-iphone-17/',tagClass:'tagIphone',fit:'contain',tone:'lavender'},
  {id:'galaxy',brand:'Samsung',name:'Galaxy S26 series',category:'Smartphone',image:'https://news.samsung.com/medialibrary/download/61778/medium',source:'https://news.samsung.com/medialibrary/global/photo/61778?album=170',tagClass:'tagGalaxy',fit:'cover',tone:'silver'},
  {id:'oppo',brand:'OPPO',name:'Reno16 5G',category:'Smartphone',image:'https://www.oppo.com/content/dam/oppo_com/common/mkt/v2-2/oppo-reno16-series-en/specs/reno16/light-purple-deep-purple-white.png',source:'https://www.oppo.com/in/smartphones/series-reno/reno16/specs/',tagClass:'tagOppo',fit:'contain',tone:'purple'},
  {id:'vivo',brand:'vivo',name:'V50',category:'Smartphone',image:'https://asia-exstatic-vivofs.vivo.com/PSee2l50xoirPK7y/Picture_library/1741854041252/zip/img/pc2.jpg',source:'https://www.vivo.com/en/products/picture/v50',tagClass:'tagVivo',fit:'cover',tone:'blue'},
  {id:'ipad',brand:'Apple',name:'iPad Air',category:'Tablet',image:'https://www.apple.com/v/ipad-air/ah/images/overview/two-sizes/gallery-toggle/spin_reverse_endframe__crvqft16efue_large.png',source:'https://www.apple.com/in/ipad-air/',tagClass:'tagIpad',fit:'contain',tone:'blue'},
  {id:'macbook',brand:'Apple',name:'MacBook Air',category:'Laptop',image:'https://www.apple.com/v/macbook-air/specs/b/images/specs/13-inch/mba_13_size1__eyfditb7ixea_large.jpg',source:'https://www.apple.com/in/macbook-air/specs/',tagClass:'tagMac',fit:'contain',tone:'silver'},
  {id:'airpods',brand:'Apple',name:'AirPods Pro 3',category:'Accessory',image:'https://www.apple.com/v/airpods-pro/r/images/specs/airpods__eqrzs6rwhu2q_large.jpg',source:'https://www.apple.com/in/airpods-pro/specs/',tagClass:'tagPods',fit:'contain',tone:'white'}
]

const families:Family[]=[
  {id:'signature',name:'ShieldTag Signature',for:'Smartphones',copy:'Compact, precise and visually balanced for modern phones.',deviceId:'iphone',label:'SIGNATURE'},
  {id:'pro',name:'ShieldTag Pro',for:'Tablets',copy:'A larger format proportioned for tablet backs and cases.',deviceId:'ipad',label:'PRO'},
  {id:'executive',name:'ShieldTag Executive',for:'Laptops',copy:'A restrained plaque-style identity badge for premium computers.',deviceId:'macbook',label:'EXECUTIVE'},
  {id:'mini',name:'ShieldTag Mini',for:'Compact accessories',copy:'A reduced-format badge for small compatible surfaces.',deviceId:'airpods',label:'MINI'},
  {id:'utility',name:'ShieldTag Utility',for:'Universal technology',copy:'A flexible format for supported electronics and asset contexts.',deviceId:'galaxy',label:'UTILITY'}
]

const installSteps=[
  ['Clean','Prepare a clean, dry, compatible surface.'],
  ['Peel','Lift the ShieldTag carefully from its backing.'],
  ['Align','Keep clear of cameras, vents, buttons, hinges and charging contacts.'],
  ['Press','Apply even pressure across the badge so it sits flat.'],
  ['Ready','Inspect the edges and follow the approved product-care guidance.']
]

const videos=[
  {id:'apply',title:'How to Apply',copy:'Animated application guide showing the Clean → Peel → Align → Press → Ready sequence.',device:'iphone'},
  {id:'match',title:'Find Your Match',copy:'Motion preview of ShieldTag finishes changing with different device colours.',device:'oppo'},
  {id:'collection',title:'Device Collection',copy:'Cinematic sequence moving from phone to tablet, laptop and compact accessories.',device:'ipad'},
  {id:'everyday',title:'Everyday Use',copy:'Lifestyle-ready storyboard slot for the final recorded RADVORA product film.',device:'galaxy'},
  {id:'macro',title:'Product Close-Up',copy:'Macro-style motion preview focused on edge geometry, surface finish and branding.',device:'macbook'}
]

function Logo(){return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>}

function Tag({finish,label='SHIELDTAG',mini=false}:{finish:Finish;label?:string;mini?:boolean}){
  const style={'--tag-base':finish.base,'--tag-edge':finish.edge,'--tag-accent':finish.accent,'--tag-text':finish.text} as CSSProperties
  return <div className={`${ui.tag} ${mini?ui.tagMini:''}`} style={style}><div className={ui.tagRim}/><div className={ui.tagFace}><Logo/><span><b>RADVORA</b><small>{label}</small></span><i/></div></div>
}

function DeviceVisual({device,finish,label='SHIELDTAG',priority=false,interactive=false}:{device:DeviceExample;finish:Finish;label?:string;priority?:boolean;interactive?:boolean}){
  return <div className={`${ui.deviceVisual} ${ui[`tone_${device.tone}`]} ${interactive?ui.deviceInteractive:''}`}>
    <img src={device.image} alt={`${device.brand} ${device.name} shown as a RADVORA ShieldTag compatibility example`} loading={priority?'eager':'lazy'} decoding="async" className={device.fit==='cover'?ui.imageCover:ui.imageContain}/>
    <div className={`${ui.tagAnchor} ${ui[device.tagClass]}`}><Tag finish={finish} label={label} mini={device.category==='Accessory'}/></div>
    <div className={ui.deviceGloss}/>
  </div>
}

function HeroWave({finish}:{finish:Finish}){
  const wave=['iphone','galaxy','oppo','vivo','ipad','macbook']
  return <div className={ui.waveStage} aria-label="Real device examples with RADVORA ShieldTag overlays">
    <div className={ui.waveBeam}/><div className={ui.waveBeamAlt}/><div className={ui.waveHalo}/>
    {wave.map((id,index)=>{const d=devices.find(x=>x.id===id)!;return <div key={id} className={`${ui.waveItem} ${ui[`wave${index+1}`]}`}><div className={ui.waveCard}><DeviceVisual device={d} finish={finish} label={index===5?'EXECUTIVE':'SIGNATURE'} priority={index<2}/><div className={ui.waveMeta}><b>{d.brand}</b><span>{d.name}</span></div></div></div>})}
    <div className={ui.waveCaption}><span>REAL DEVICE EXAMPLES</span><b>Recognisable hardware. RADVORA identity layered with restraint.</b></div>
  </div>
}

function Ecosystem({finish}:{finish:Finish}){
  return <section className={ui.ecosystem} id="devices">
    <div className={ui.sectionIntro}><span>MADE FOR THE DEVICES YOU ALREADY USE</span><h2>Recognisable technology.<br/><em>A RADVORA layer.</em></h2><p>Manufacturer imagery is shown only to help customers understand device context and visual fit. No affiliation or endorsement is implied.</p></div>
    <div className={ui.ecoGrid}>{devices.slice(0,6).map(d=><article key={d.id} className={ui.ecoCard}><div className={ui.ecoVisual}><DeviceVisual device={d} finish={finish} label={d.category==='Laptop'?'EXECUTIVE':d.category==='Tablet'?'PRO':'SIGNATURE'}/></div><div className={ui.ecoInfo}><div><span>{d.category}</span><h3>{d.brand}</h3><p>{d.name}</p></div><a href={d.source} target="_blank" rel="noreferrer">Official image source ↗</a></div></article>)}</div>
  </section>
}

function FamilyGrid({finish}:{finish:Finish}){
  return <section className={ui.familySection} id="products"><div className={ui.sectionIntro}><span>THE SHIELDTAG FAMILY</span><h2>Designed around the device.<br/><em>Not forced onto it.</em></h2><p>Five form factors use the same restrained RADVORA visual language while changing scale and proportion for different device classes.</p></div><div className={ui.familyGrid}>{families.map((f,i)=>{const d=devices.find(x=>x.id===f.deviceId)!;return <article key={f.id} className={ui.familyCard}><div className={ui.familyIndex}>0{i+1}</div><div className={ui.familyVisual}><DeviceVisual device={d} finish={finish} label={f.label}/></div><div className={ui.familyCopy}><span>{f.for}</span><h3>{f.name}</h3><p>{f.copy}</p><a href="/compatibility">Check compatibility →</a></div></article>})}</div></section>
}

function FinishStudio({finishId,setFinishId}:{finishId:string;setFinishId:(id:string)=>void}){
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  const iphone=devices[0]
  return <section className={ui.finishSection} id="finishes"><div className={ui.finishCopy}><span>MATCH YOUR DEVICE</span><h2>Blend in.<br/><em>Stand out.</em></h2><p>Preview the same ShieldTag geometry in eight finish directions. These remain design previews until the sellable catalogue is formally approved.</p><div className={ui.finishMeta}><span>Selected finish</span><b>{finish.name}</b><p>Lighting, tag face and edge treatment update together so the finish reads as a material—not a flat colour chip.</p></div></div><div className={ui.finishStage}><div className={ui.finishDevice}><DeviceVisual device={iphone} finish={finish} label="SIGNATURE" interactive/></div><div className={ui.finishLight}/><div className={ui.finishSwatches}>{finishes.map(f=><button key={f.id} className={f.id===finishId?ui.swatchActive:''} onClick={()=>setFinishId(f.id)} aria-pressed={f.id===finishId}><i style={{'--swatch':f.base,'--edge':f.edge} as CSSProperties}/><span>{f.name}</span></button>)}</div></div></section>
}

function DeviceMatcher({finishId,setFinishId}:{finishId:string;setFinishId:(id:string)=>void}){
  const [brand,setBrand]=useState('Apple')
  const [category,setCategory]=useState('Smartphone')
  const match=useMemo(()=>devices.find(d=>d.brand===brand&&d.category===category)??devices.find(d=>d.brand===brand)??devices[0],[brand,category])
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  const availableBrands=[...new Set(devices.map(d=>d.brand))]
  return <section className={ui.matcherSection} id="matcher"><div className={ui.matcherPanel}><div className={ui.matcherIntro}><span>FIND YOUR MATCH</span><h2>Preview before you decide.</h2><p>Choose a device context and finish. Exact model compatibility stays fail-closed until an approved device guide confirms it.</p></div><div className={ui.matcherControls}><label><span>01 Device category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option>Smartphone</option><option>Tablet</option><option>Laptop</option><option>Accessory</option></select></label><label><span>02 Brand example</span><select value={brand} onChange={e=>setBrand(e.target.value)}>{availableBrands.map(b=><option key={b}>{b}</option>)}</select></label><label><span>03 ShieldTag finish</span><select value={finishId} onChange={e=>setFinishId(e.target.value)}>{finishes.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><div className={ui.matcherStatus}><span>04 Compatibility status</span><b>Compatibility confirmation required</b><p>No model-level fit is inferred from a visual preview.</p></div></div></div><div className={ui.matcherPreview}><DeviceVisual device={match} finish={finish} label={category==='Laptop'?'EXECUTIVE':category==='Tablet'?'PRO':category==='Accessory'?'MINI':'SIGNATURE'} interactive/><div className={ui.matcherBadge}><span>PREVIEW</span><b>{match.brand} · {match.name}</b><small>{finish.name}</small></div></div></section>
}

function ApplicationGallery({finish}:{finish:Finish}){
  return <section className={ui.gallerySection}><div className={ui.sectionIntro}><span>REAL-DEVICE APPLICATION GALLERY</span><h2>See it in context.<br/><em>Not in isolation.</em></h2><p>Every example keeps the ShieldTag away from obvious cameras, controls and critical hardware zones. Final placement remains subject to the approved compatibility guide.</p></div><div className={ui.galleryGrid}>{['iphone','galaxy','oppo','vivo','ipad','macbook'].map((id,i)=>{const d=devices.find(x=>x.id===id)!;return <figure key={id} className={`${ui.galleryCard} ${i===0||i===5?ui.galleryWide:''}`}><DeviceVisual device={d} finish={finish} label={d.category==='Laptop'?'EXECUTIVE':d.category==='Tablet'?'PRO':'SIGNATURE'}/><figcaption><b>{d.brand} {d.name}</b><span>Compatibility illustration · placement preview</span></figcaption></figure>})}</div></section>
}

function BeforeAfter({finish}:{finish:Finish}){
  const [reveal,setReveal]=useState(54)
  const d=devices[0]
  return <section className={ui.beforeSection}><div className={ui.beforeCopy}><span>BEFORE / AFTER</span><h2>One device.<br/><em>One considered detail.</em></h2><p>Drag the control to compare the same real-device example before and after the RADVORA badge is added.</p></div><div className={ui.compare} style={{'--reveal':`${reveal}%`} as CSSProperties}><div className={ui.compareBase}><img src={d.image} alt="iPhone example before adding RADVORA ShieldTag"/></div><div className={ui.compareOverlay}><img src={d.image} alt="iPhone example with RADVORA ShieldTag preview"/><div className={`${ui.tagAnchor} ${ui[d.tagClass]}`}><Tag finish={finish} label="SIGNATURE"/></div></div><div className={ui.compareLabels}><span>Before ShieldTag</span><span>With RADVORA</span></div><input aria-label="Compare device before and after ShieldTag" type="range" min="8" max="92" value={reveal} onChange={e=>setReveal(Number(e.target.value))}/><div className={ui.compareHandle}/></div></section>
}

function Installation({finish}:{finish:Finish}){
  const [step,setStep]=useState(0)
  const [playing,setPlaying]=useState(true)
  useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setStep(v=>(v+1)%installSteps.length),1900);return()=>window.clearInterval(id)},[playing])
  return <section className={ui.installSection} id="how"><div className={ui.installText}><span>ATTACH IN SECONDS</span><h2>Peel. Align.<br/><em>Press. Ready.</em></h2><p>The animation demonstrates the intended sequence only. It is clearly separated from a future recorded installation film.</p><div className={ui.stepList}>{installSteps.map(([title,copy],i)=><button key={title} onClick={()=>{setStep(i);setPlaying(false)}} className={step===i?ui.stepActive:''}><span>0{i+1}</span><div><b>{title}</b><p>{copy}</p></div></button>)}</div></div><div className={ui.installDemo}><div className={ui.demoTop}><span>ANIMATED APPLICATION GUIDE · NOT RECORDED FOOTAGE</span><button onClick={()=>setPlaying(v=>!v)}>{playing?'Pause':'Play'}</button></div><div className={ui.demoStage} data-step={step}><div className={ui.demoPhone}><img src={devices[0].image} alt="Device used in animated ShieldTag application guide"/></div><div className={ui.demoCloth}/><div className={ui.demoBacking}/><div className={ui.demoTag}><Tag finish={finish} label="SIGNATURE"/></div><div className={ui.demoFinger}/><div className={ui.demoPulse}/></div><div className={ui.demoCaption}><b>{installSteps[step][0]}</b><p>{installSteps[step][1]}</p></div></div></section>
}

function VideoGallery({finish}:{finish:Finish}){
  const [active,setActive]=useState('apply')
  return <section className={ui.videoSection}><div className={ui.sectionIntro}><span>PRODUCT FILM SYSTEM</span><h2>Motion where it helps.<br/><em>No fake footage.</em></h2><p>These are production-ready motion preview slots. Final recorded RADVORA videos can replace them later without changing the layout.</p></div><div className={ui.videoGrid}>{videos.map(v=>{const d=devices.find(x=>x.id===v.device)!;const on=active===v.id;return <button key={v.id} className={`${ui.videoCard} ${on?ui.videoActive:''}`} onClick={()=>setActive(v.id)}><div className={ui.videoPoster}><DeviceVisual device={d} finish={finish} label={d.category==='Laptop'?'EXECUTIVE':d.category==='Tablet'?'PRO':'SIGNATURE'}/><div className={ui.playDisc}>{on?'II':'▶'}</div><div className={ui.videoScan}/></div><div className={ui.videoCopy}><span>MOTION PREVIEW</span><h3>{v.title}</h3><p>{v.copy}</p></div></button>})}</div></section>
}

function Materials(){return <section className={ui.materialSection}><div className={ui.sectionIntro}><span>MATERIALS / FINISH</span><h2>A precision identity badge.<br/><em>Not a generic sticker.</em></h2><p>The page intentionally separates visual design direction from performance claims that still require production validation.</p></div><div className={ui.materialGrid}><article><span>01</span><h3>Refined edges</h3><p>Chamfer-inspired geometry and controlled proportions create a hardware-led silhouette.</p></article><article><span>02</span><h3>Controlled reflectivity</h3><p>Matte, satin and metallic visual directions avoid exaggerated chrome and neon.</p></article><article><span>03</span><h3>Device-aware proportions</h3><p>Phone, tablet, laptop and Mini formats scale independently instead of forcing one sticker size everywhere.</p></article><article><span>04</span><h3>Performance under validation</h3><p>No waterproof, residue-free, scratch-proof, reusable or lifetime-adhesion claim is published without evidence.</p></article></div></section>}

function Packaging({finish}:{finish:Finish}){return <section className={ui.packSection}><div className={ui.packVisual}><div className={ui.packShadow}/><div className={ui.packBox}><div className={ui.packLid}><Logo/><b>RADVORA</b><span>SHIELDTAG SIGNATURE</span><small>{finish.name.toUpperCase()}</small></div><div className={ui.packInner}><Tag finish={finish} label="SIGNATURE"/><p>Peel. Align. Press. Ready.</p><i>INSTALLATION GUIDE</i></div></div></div><div className={ui.packCopy}><span>PACKAGING EXPERIENCE</span><h2>Unbox it like premium technology.</h2><p>Dark graphite presentation, a precision product cradle and simple application guidance create a cleaner first impression than conventional sticker packaging.</p><div className={ui.packFacts}><div><b>Front</b><p>RADVORA · ShieldTag family · approved finish name</p></div><div><b>Inside</b><p>Product cradle · application card · installation guide</p></div><div><b>Back</b><p>Only verified variant, care, batch and statutory information.</p></div></div></div></section>}

function Compatibility(){return <section className={ui.compatSection}><div><span>COMPATIBILITY / CLAIM CONTROL</span><h2>Clear where it fits.<br/><em>Clear where it does not.</em></h2></div><div className={ui.compatCards}><article><b>Placement first</b><p>Keep away from cameras, vents, ports, buttons, charging contacts, hinges and other functional surfaces.</p></article><article><b>Model fit stays verified</b><p>Visual examples demonstrate appearance only. Exact device compatibility must come from the approved device guide.</p></article><article><b>Water resistance</b><p>A specific water-resistance rating will be published only after the final production product completes required validation. Until then, avoid immersion and prolonged water exposure.</p></article></div></section>}

function FAQ(){return <section className={ui.faq}><div className={ui.sectionIntro}><span>QUESTIONS / ANSWERED UP FRONT</span><h2>Clarity builds confidence.</h2></div><div className={ui.faqList}><details open><summary>How do I apply ShieldTag?</summary><p>Clean the compatible surface, peel carefully, align away from functional hardware, press evenly, then inspect the edges and follow the approved product guidance.</p></details><details><summary>Which devices are supported?</summary><p>The product family is being designed for smartphones, tablets, laptops and selected accessories. Exact model compatibility is confirmed only through the approved device guide.</p></details><details><summary>Can I match the ShieldTag to my device colour?</summary><p>Yes. The current design system includes eight visual finish directions so customers can preview either a close match or deliberate contrast.</p></details><details><summary>Is ShieldTag waterproof?</summary><p>A specific water-resistance rating will only be published after the final production version has completed the required validation. Until then, avoid immersion and prolonged water exposure.</p></details><details><summary>Can I remove and reapply it?</summary><p>Removal and reapplication characteristics will be published with the validated adhesive and production specification. They are not assumed here.</p></details><details><summary>Are Apple, Samsung, OPPO or vivo affiliated with RADVORA?</summary><p>No affiliation or endorsement is implied by the compatibility examples on this page. Manufacturer names and imagery are used to help customers understand device context.</p></details></div></section>}

export default function RealDeviceExperience(){
  const [finishId,setFinishId]=useState('obsidian')
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  return <div className={ui.page}>
    <header className={ui.nav}><a className={ui.brand} href="/"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a><nav><a href="#devices">Devices</a><a href="#products">Products</a><a href="#finishes">Finishes</a><a href="#matcher">Find Your Match</a><a href="#how">How to Apply</a></nav><a className={ui.navCta} href="#matcher">Find Your Match <span>→</span></a></header>
    <main>
      <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>PREMIUM DEVICE IDENTITY</span><h1>One Shield.<br/><em>Every Device.</em></h1><p>RADVORA ShieldTag is designed to feel native to the technology you already own—shown here on recognisable real-device examples with restrained, device-aware placement.</p><div className={ui.heroActions}><a href="#products">Explore ShieldTag <span>→</span></a><a className={ui.ghost} href="#how">See How It Works</a></div><div className={ui.heroProof}><span>Real device examples</span><span>Colour-matched finishes</span><span>Compatibility kept explicit</span></div></div><HeroWave finish={finish}/></section>
      <Ecosystem finish={finish}/><FamilyGrid finish={finish}/><FinishStudio finishId={finishId} setFinishId={setFinishId}/><DeviceMatcher finishId={finishId} setFinishId={setFinishId}/><ApplicationGallery finish={finish}/><BeforeAfter finish={finish}/><Installation finish={finish}/><VideoGallery finish={finish}/><Materials/><Packaging finish={finish}/><Compatibility/><FAQ/>
      <section className={ui.finalCta}><span>RADVORA SHIELDTAG</span><h2>One Shield. Every Device.</h2><p>Find the ShieldTag designed to complement the technology you already own.</p><div><a href="#matcher">Find Your Match <span>→</span></a><a className={ui.ghost} href="#finishes">View Finishes</a><a className={ui.ghost} href="/compatibility">Compatibility Guide</a></div></section>
    </main>
    <footer className={ui.footer}><a className={ui.brand} href="/"><Logo/><span><b>RADVORA</b><small>ONE SHIELD. EVERY DEVICE.</small></span></a><div><a href="/products">Products</a><a href="/compatibility">Compatibility</a><a href="/support">Support</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div><p>Manufacturer imagery is used for compatibility illustration only. No endorsement or affiliation is implied.</p></footer>
  </div>
}
