'use client'

import { CSSProperties, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)
import ui from './real-device-experience.module.css'
import ProductInterestForm from './product-interest-form'
import { buildShieldTagSharePayload } from '../lib/shieldtag-share'

// ShieldTag consumer experience. Device styling previews remain separate from compatibility verification.

type Finish={id:string;name:string;base:string;edge:string;accent:string;text:string}
type DeviceCategory='Smartphone'|'Tablet'|'Laptop'|'Accessory'
type DeviceExample={id:string;brand:string;name:string;category:DeviceCategory;deviceColor:string;image:string;syncFinish:Finish}

const finishes:Finish[]=[
  {id:'obsidian',name:'Obsidian',base:'#0b0d10',edge:'#606871',accent:'#85eaff',text:'#f8fbfd'},
  {id:'titanium',name:'Titanium',base:'#adb4bb',edge:'#f3f6f8',accent:'#d8f8ff',text:'#111820'},
  {id:'graphite',name:'Graphite',base:'#34383e',edge:'#7a838b',accent:'#9defff',text:'#f7fafc'},
  {id:'arctic',name:'Arctic',base:'#edf1f3',edge:'#ffffff',accent:'#baf3ff',text:'#15202a'},
  {id:'midnight',name:'Midnight',base:'#15273f',edge:'#5c7594',accent:'#7acaff',text:'#f7fbff'},
  {id:'rose',name:'Rose',base:'#9d7069',edge:'#deb7b0',accent:'#ffd0c5',text:'#fffaf8'},
  {id:'forest',name:'Forest',base:'#213d35',edge:'#6d8c82',accent:'#8ff0d4',text:'#f6fffb'},
  {id:'champagne',name:'Champagne',base:'#b99f73',edge:'#e7d4ae',accent:'#ffe4a8',text:'#211b12'}
]

const devices:DeviceExample[]=[
  {id:'iphone',brand:'Apple',name:'iPhone 17',category:'Smartphone',deviceColor:'Lavender',image:'https://www.apple.com/v/iphone-17/g/images/overview/product-viewer/colors_lavender__bcaie9a8npj6_large.jpg',syncFinish:{id:'lavender-sync',name:'Lavender Sync',base:'#c9bfd9',edge:'#f1eaf8',accent:'#e6d7ff',text:'#211b2b'}},
  {id:'galaxy',brand:'Samsung',name:'Galaxy S26',category:'Smartphone',deviceColor:'Silver Shadow',image:'https://images.samsung.com/is/image/samsung/p6pim/in/s2602/gallery/in-galaxy-s26-s942-578627-sm-s942bzscins-550888079?%24624_624_PNG%24=',syncFinish:{id:'silver-sync',name:'Silver Sync',base:'#aeb2b9',edge:'#eef1f4',accent:'#d9f7ff',text:'#11161c'}},
  {id:'oppo',brand:'OPPO',name:'Reno16 5G',category:'Smartphone',deviceColor:'Twilight Purple',image:'https://www.oppo.com/content/dam/oppo_com/common/mkt/v2-2/oppo-reno16-series-en/specs/reno16/light-purple-deep-purple-white.png',syncFinish:{id:'violet-sync',name:'Violet Sync',base:'#4d354f',edge:'#a781aa',accent:'#d9aee2',text:'#fff9ff'}},
  {id:'vivo',brand:'vivo',name:'V50',category:'Smartphone',deviceColor:'Starry Blue',image:'https://asia-exstatic-vivofs.vivo.com/PSee2l50xoirPK7y/1740991283302/e337d8e8bdec570993f6c7c4228af755.png',syncFinish:{id:'blue-sync',name:'Blue Sync',base:'#184c9d',edge:'#6aa3e8',accent:'#8fd5ff',text:'#f5fbff'}},
  {id:'ipad',brand:'Apple',name:'iPad Air',category:'Tablet',deviceColor:'Space Gray',image:'https://www.apple.com/v/ipad-air/ah/images/overview/closer-look/space-gray/slide_2B__dvqfqwnkj2c2_large.jpg',syncFinish:{id:'ipad-sync',name:'Space Gray Sync',base:'#68686b',edge:'#a8aaad',accent:'#c7edf7',text:'#f7fafb'}},
  {id:'tabs11',brand:'Samsung',name:'Galaxy Tab S11',category:'Tablet',deviceColor:'Gray',image:'https://images.samsung.com/is/image/samsung/assets/pe/tablets/galaxy-tab-s11/buy/TS11_Color_Selection_Gray_MO_720x480.png',syncFinish:{id:'tab-sync',name:'Graphite Sync',base:'#676b70',edge:'#b7bcc1',accent:'#c7edf7',text:'#f7fafb'}},
  {id:'macbook',brand:'Apple',name:'MacBook Air',category:'Laptop',deviceColor:'Silver',image:'https://www.apple.com/v/macbook-air/specs/b/images/specs/13-inch/mba_13_size1__eyfditb7ixea_large.jpg',syncFinish:{id:'mac-sync',name:'Silver Sync',base:'#b8bdc2',edge:'#f0f3f5',accent:'#d9f6ff',text:'#141a1f'}},
  {id:'xps',brand:'Dell',name:'XPS 13',category:'Laptop',deviceColor:'Platinum',image:'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-13-9350/spi/platinum/oled/notebook-xps-13-9350-oled-silver-campaign-hero-504x350-ng.psd?fmt=jpg&hei=400&wid=570',syncFinish:{id:'xps-sync',name:'Platinum Sync',base:'#b7babd',edge:'#f3f5f6',accent:'#d8f5ff',text:'#12191f'}},
  {id:'buds',brand:'Samsung',name:'Galaxy Buds3 FE Case',category:'Accessory',deviceColor:'Black',image:'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r420nzkainu/gallery/in-galaxy-buds3-fe-563497-sm-r420nzkainu-thumb-548868596?%24624_624_PNG%24=',syncFinish:{id:'buds-sync',name:'Matte Black Sync',base:'#17191c',edge:'#545a61',accent:'#6ce7ff',text:'#f6fafc'}},
  {id:'powerbank',brand:'Samsung',name:'20,000mAh Battery Pack',category:'Accessory',deviceColor:'Beige',image:'https://images.samsung.com/is/image/samsung/p6pim/in/eb-p4520xuegin/gallery/in-battery-pack-20000mah-eb-p4520-eb-p4520xuegin-541529928?%241164_776_PNG%24=',syncFinish:{id:'beige-sync',name:'Warm Beige Sync',base:'#d3cbbd',edge:'#f6f1e7',accent:'#e8fbff',text:'#28231d'}}
]

const formats=[
  {n:'01',name:'Signature',device:'Smartphones',copy:'Compact proportions for the device you reach for all day.'},
  {n:'02',name:'Pro',device:'Tablets',copy:'A broader badge proportioned for larger rear surfaces.'},
  {n:'03',name:'Executive',device:'Laptops',copy:'A restrained plaque expression for premium computers.'},
  {n:'04',name:'Mini',device:'Accessories',copy:'A smaller-format identity mark for compact technology.'}
]

function Logo(){return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>}
function labelFor(category:DeviceCategory){return category==='Laptop'?'EXECUTIVE':category==='Tablet'?'PRO':category==='Accessory'?'MINI':'SIGNATURE'}

function Tag({finish,label}:{finish:Finish;label:string}){
  const style={'--tag-base':finish.base,'--tag-edge':finish.edge,'--tag-accent':finish.accent,'--tag-text':finish.text} as CSSProperties
  return <div className={ui.tag} style={style}><div className={ui.tagRim}/><div className={ui.tagFace}><Logo/><span><b>RADVORA</b><small>{label}</small></span><i/></div></div>
}

function DeviceVisual({device,finish,priority=false}:{device:DeviceExample;finish:Finish;priority?:boolean}){
  const [failed,setFailed]=useState(false)
  return <div className={`${ui.deviceVisual} ${ui[`category_${device.category.toLowerCase()}`]}`}>
    <div className={ui.deviceAura}/>
    {!failed?<img src={device.image} alt={`${device.brand} ${device.name} with RADVORA ShieldTag styling preview`} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" draggable={false} onError={()=>setFailed(true)}/>:<div className={ui.deviceFallback}><Logo/><b>{device.brand}</b><span>{device.name}</span></div>}
    <div className={ui.tagAnchor}><Tag finish={finish} label={labelFor(device.category)}/></div>
  </div>
}

function ShieldLab({onSaved}:{onSaved:(label:string)=>void}){
  const [deviceId,setDeviceId]=useState('iphone')
  const [finishId,setFinishId]=useState('titanium')
  const [message,setMessage]=useState('')
  const stageRef=useRef<HTMLDivElement>(null)
  const visualRef=useRef<HTMLDivElement>(null)
  const previousSelection=useRef(`${deviceId}:${finishId}`)
  const pendingFlip=useRef<ReturnType<typeof Flip.getState>|null>(null)

  const selected=useMemo(()=>devices.find(item=>item.id===deviceId)??devices[0],[deviceId])
  const finish=useMemo(()=>finishes.find(item=>item.id===finishId)??finishes[1],[finishId])
  const categoryDevices=useMemo(()=>devices.filter(item=>item.category===selected.category),[selected.category])

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const fromDevice=params.get('device')
    const fromFinish=params.get('finish')
    const validDevice=devices.some(item=>item.id===fromDevice)
    const validFinish=finishes.some(item=>item.id===fromFinish)
    if(validDevice&&fromDevice)setDeviceId(fromDevice)
    if(validFinish&&fromFinish)setFinishId(fromFinish)
    if(!validDevice&&!validFinish){
      try{
        const saved=JSON.parse(localStorage.getItem('radvora-shieldlab')||'null') as {deviceId?:string;finishId?:string;savedAt?:number}|null
        const savedDevice=saved?.deviceId?devices.find(item=>item.id===saved.deviceId):undefined
        const savedFinish=saved?.finishId?finishes.find(item=>item.id===saved.finishId):undefined
        if(savedDevice)setDeviceId(savedDevice.id)
        if(savedFinish)setFinishId(savedFinish.id)
        if(savedDevice&&savedFinish)setMessage(`Restored your saved build: ${savedDevice.brand} ${savedDevice.name} · ${savedFinish.name}.`)
      }catch{}
    }
  },[])

  useEffect(()=>{
    const key=`${deviceId}:${finishId}`
    if(previousSelection.current===key){previousSelection.current=key;return}
    previousSelection.current=key
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const visual=visualRef.current
    const stage=stageRef.current
    if(!visual||!stage)return
    const state=pendingFlip.current
    pendingFlip.current=null
    gsap.killTweensOf([visual,stage])
    if(state)Flip.from(state,{duration:.62,ease:'power3.inOut',absolute:false,scale:true})
    gsap.fromTo(visual,{opacity:.58,scale:.965,y:12},{opacity:1,scale:1,y:0,duration:.58,ease:'power3.out',clearProps:'opacity,scale,y'})
    gsap.fromTo(stage,{filter:'brightness(.9)'},{filter:'brightness(1)',duration:.7,ease:'power2.out',clearProps:'filter'})
  },[deviceId,finishId])

  useEffect(()=>{
    const url=new URL(window.location.href)
    const params=new URLSearchParams()
    params.set('device',deviceId)
    params.set('finish',finishId)
    url.search=params.toString()
    window.history.replaceState({},'',url)
  },[deviceId,finishId])

  function handleStagePointerMove(event:React.PointerEvent<HTMLDivElement>){
    if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const rect=event.currentTarget.getBoundingClientRect()
    const x=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width))
    const y=Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height))
    event.currentTarget.style.setProperty('--stage-rx',`${((0.5-y)*4).toFixed(2)}deg`)
    event.currentTarget.style.setProperty('--stage-ry',`${((x-0.5)*6).toFixed(2)}deg`)
    event.currentTarget.style.setProperty('--light-x',`${(x*100).toFixed(1)}%`)
    event.currentTarget.style.setProperty('--light-y',`${(y*100).toFixed(1)}%`)
  }

  function resetStageDepth(event:React.PointerEvent<HTMLDivElement>){
    event.currentTarget.style.setProperty('--stage-rx','0deg')
    event.currentTarget.style.setProperty('--stage-ry','0deg')
    event.currentTarget.style.setProperty('--light-x','50%')
    event.currentTarget.style.setProperty('--light-y','45%')
  }

  function captureFlip(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    if(visualRef.current)pendingFlip.current=Flip.getState(visualRef.current)
  }

  function chooseDevice(id:string){captureFlip();setDeviceId(id)}
  function chooseFinish(id:string){captureFlip();setFinishId(id)}

  function chooseCategory(category:DeviceCategory){
    const first=devices.find(item=>item.category===category)
    if(first)chooseDevice(first.id)
  }

  function saveBuild(){
    try{
      localStorage.setItem('radvora-shieldlab',JSON.stringify({deviceId,finishId,savedAt:Date.now()}))
      const label=`${selected.brand} ${selected.name} · ${finish.name}`
      onSaved(label)
      setMessage('Saved on this device. It will be restored when you return.')
    }catch{setMessage('This browser could not save the build.')}
  }

  async function shareBuild(){
    const share=buildShieldTagSharePayload(window.location.origin,window.location.pathname,{deviceId,finishId,label:`${selected.brand} ${selected.name} · ${finish.name}`})
    try{
      if(navigator.share){await navigator.share(share);setMessage('Shared.')}
      else{await navigator.clipboard.writeText(share.url);setMessage('Build link copied.')}
    }catch{}
  }

  return <section className={ui.lab} id="shieldlab">
    <div ref={stageRef} className={ui.labStage} aria-live="polite" onPointerMove={handleStagePointerMove} onPointerLeave={resetStageDepth}>
      <div className={ui.stageMeta}><span>SHIELDLAB / LIVE PREVIEW</span><b>{selected.brand} {selected.name}</b><small>{selected.deviceColor} · {finish.name}</small></div>
      <div ref={visualRef} className={ui.motionVisual}><DeviceVisual device={selected} finish={finish}/></div>
      <div className={ui.stageFooter}><span>{labelFor(selected.category)}</span><b>{finish.name}</b></div>
    </div>
    <div className={ui.labControls}>
      <span className={ui.eyebrow}>BUILD YOUR SHIELDTAG</span>
      <h2>One device.<br/><em>Your finish.</em></h2>
      <p>Choose a real device context, tune the finish, save the build and share the exact combination. Fit remains model-specific and is verified separately.</p>
      <div className={ui.categoryTabs} role="tablist" aria-label="Device categories">
        {(['Smartphone','Tablet','Laptop','Accessory'] as DeviceCategory[]).map(category=><button type="button" role="tab" aria-selected={selected.category===category} key={category} onClick={()=>chooseCategory(category)}>{category}</button>)}
      </div>
      <label className={ui.deviceSelect}><span>DEVICE</span><select value={selected.id} onChange={e=>chooseDevice(e.target.value)}>{categoryDevices.map(device=><option key={device.id} value={device.id}>{device.brand} · {device.name}</option>)}</select></label>
      <div className={ui.finishGrid} aria-label="Finish selector">{finishes.map(item=><button type="button" key={item.id} aria-pressed={finishId===item.id} onClick={()=>chooseFinish(item.id)}><i style={{'--swatch':item.base,'--edge':item.edge} as CSSProperties}/><span>{item.name}</span></button>)}</div>
      <div className={ui.labActions}><button type="button" onClick={saveBuild}>Save build</button><button type="button" onClick={shareBuild}>Share build</button><a href="/compatibility">Verify fit →</a></div>
      <p className={ui.labStatus} role="status" aria-live="polite">{message||'Your device and finish are encoded in the page link.'}</p>
      <ProductInterestForm source="shieldlab-interest" context={`${selected.brand} ${selected.name} · ${finish.name}`} compact/>
    </div>
  </section>
}


function LinkResolver(){
  const [value,setValue]=useState('')
  const [state,setState]=useState<'idle'|'loading'|'success'|'error'>('idle')
  const [result,setResult]=useState<{url?:string;redirects?:string[];error?:string}>({})
  const cardRef=useRef<HTMLDivElement>(null)
  const resultRef=useRef<HTMLDivElement>(null)
  const requestRef=useRef<AbortController|null>(null)

  function resetResolver(){
    requestRef.current?.abort()
    requestRef.current=null
    setValue('');setResult({});setState('idle')
    requestAnimationFrame(()=>document.getElementById('radvora-link')?.focus())
  }

  async function resolveLink(event:React.FormEvent){
    event.preventDefault()
    if(!value.trim())return
    const card=cardRef.current
    const flip=card&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches?Flip.getState(card):null
    requestRef.current?.abort()
    const controller=new AbortController()
    requestRef.current=controller
    setState('loading');setResult({})
    try{
      const response=await fetch('/api/link/resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:value.trim()}),signal:controller.signal})
      const data=await response.json() as {ok:boolean;url?:string;redirects?:string[];error?:{message?:string}}
      if(!response.ok||!data.ok)throw new Error(data.error?.message||'This link could not be resolved.')
      setResult({url:data.url,redirects:data.redirects});setState('success')
    }catch(error){
      if(controller.signal.aborted)return
      setResult({error:error instanceof Error?error.message:'This link could not be resolved.'});setState('error')
    }finally{if(requestRef.current===controller)requestRef.current=null}
    requestAnimationFrame(()=>{
      if(flip&&cardRef.current)Flip.from(flip,{duration:.55,ease:'power3.inOut',absolute:false,scale:true})
      resultRef.current?.focus()
    })
  }

  return <section className={ui.linkResolver} aria-labelledby="link-resolver-title">
    <div className={ui.resolverCopy}><span className={ui.eyebrow}>LINK LAB / SAFE RESOLUTION</span><h2 id="link-resolver-title">Paste the wrapper.<br/><em>See the destination.</em></h2><p>Resolve supported shared and shortened links through RADVORA's guarded server path before opening the final destination.</p></div>
    <div ref={cardRef} className={ui.resolverCard} data-state={state} aria-busy={state==='loading'}>
      <form onSubmit={resolveLink}><label htmlFor="radvora-link">LINK</label><div><input id="radvora-link" type="url" inputMode="url" autoComplete="url" placeholder="https://…" value={value} onChange={e=>setValue(e.target.value)} required/><button type="submit" disabled={state==='loading'}>{state==='loading'?'Resolving…':'Resolve link'}</button></div></form>
      {state==='loading'?<div className={ui.resolverSkeleton} aria-live="polite"><i/><i/><i/></div>:null}
      {state==='success'&&result.url?<div ref={resultRef} tabIndex={-1} className={ui.resolverResult}><span>SAFE DESTINATION</span><strong>{result.url}</strong><small>{result.redirects?.length||0} redirect{result.redirects?.length===1?'':'s'} followed</small><a href={result.url} target="_blank" rel="noreferrer noopener">Open destination →</a><button type="button" onClick={resetResolver}>Resolve another</button></div>:null}
      {state==='error'?<div className={ui.resolverError} role="alert"><p>{result.error}</p><button type="button" onClick={resetResolver}>Try another link</button></div>:null}
    </div>
  </section>
}

export default function RealDeviceExperience(){
  const router=useRouter()
  const heroDevice=devices[0]
  const heroFinish=finishes[0]
  const [savedBuildLabel,setSavedBuildLabel]=useState<string|null>(null)
  const cinematicRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    if(params.has('device')||params.has('finish'))return
    try{
      const saved=JSON.parse(localStorage.getItem('radvora-shieldlab')||'null') as {deviceId?:string;finishId?:string}|null
      const savedDevice=saved?.deviceId?devices.find(item=>item.id===saved.deviceId):undefined
      const savedFinish=saved?.finishId?finishes.find(item=>item.id===saved.finishId):undefined
      if(savedDevice&&savedFinish)setSavedBuildLabel(`${savedDevice.brand} ${savedDevice.name} · ${savedFinish.name}`)
    }catch{}
  },[])

  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const root=cinematicRef.current
    if(!root)return
    const update=()=>{
      const rect=root.getBoundingClientRect()
      const travel=Math.max(1,rect.height-window.innerHeight)
      const progress=Math.min(1,Math.max(0,-rect.top/travel))
      root.style.setProperty('--cinematic-progress',String(progress))
      root.style.setProperty('--cinematic-shift',`${progress*100}%`)
    }
    update(); window.addEventListener('scroll',update,{passive:true}); window.addEventListener('resize',update)
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)}
  },[])

  function transitionRoute(event:MouseEvent<HTMLAnchorElement>){
    const href=event.currentTarget.getAttribute('href')
    if(!href||href.startsWith('#')||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
    event.preventDefault()
    const navigate=()=>router.push(href)
    const doc=document as Document&{startViewTransition?:(callback:()=>void)=>void}
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!doc.startViewTransition){navigate();return}
    doc.startViewTransition(navigate)
  }

  return <div className={ui.page}>
    <header className={ui.nav}>
      <a className={ui.brand} href="/" aria-label="RADVORA home" style={{viewTransitionName:'radvora-brand'}}><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a>
      <nav aria-label="Primary"><a href="#story">Discover</a><a href="#shieldlab">ShieldLab</a><a href="/products" onClick={transitionRoute}>Shop</a><a href="/account" onClick={transitionRoute}>My RADVORA</a></nav>
      <a className={ui.navCta} href="#shieldlab" style={{viewTransitionName:'radvora-primary-cta'}}>{savedBuildLabel?'Resume build':'Build yours'}</a>
    </header>

    <main>
      <section ref={cinematicRef} className={ui.cinematicOpening} aria-label="RADVORA ShieldTag introduction">
        <div className={ui.cinematicSticky}>
          <div className={ui.cinematicAtmosphere}/><span className={ui.cinematicIndex}>RADVORA / 01</span>
          <div className={ui.cinematicWords} aria-hidden="true"><b>YOUR DEVICE.</b><b>YOUR IDENTITY.</b><b>YOUR SHIELD.</b></div>
          <div className={ui.shieldTagHero} aria-hidden="true"><span className={ui.shieldTagHalo}/><span className={ui.shieldTagPlate}><span className={ui.shieldTagMark}>R</span><span className={ui.shieldTagSignal}>)))</span></span><span className={ui.shieldTagCaption}>SHIELDTAG / IDENTITY LAYER</span></div><div className={ui.cinematicProduct}><DeviceVisual device={heroDevice} finish={heroFinish} priority/></div>
          <div className={ui.cinematicCopy}>
            <span className={ui.eyebrow}>RADVORA / SHIELDTAG</span>
            <h1>Your device.<br/><em>Still yours.</em></h1>
            <p>A precision identity detail designed to become part of the hardware—not another thing competing with it.</p>
            <div className={ui.heroActions}><a href="#shieldlab">{savedBuildLabel?'Resume your saved build':'Build your ShieldTag'}</a><a href="/compatibility" onClick={transitionRoute}>Verify exact fit</a></div>
            {savedBuildLabel?<p className={ui.savedBuildHint}>Saved on this device · {savedBuildLabel}</p>:null}
          </div>
          <div className={ui.cinematicFinal}><small>ONE VISUAL LANGUAGE</small><strong>ONE SHIELD.<br/>EVERY DEVICE.</strong><a href="#story">Discover ↓</a></div>
          <span className={ui.cinematicMark}>RADVORA</span>
        </div>
      </section>

      <section className={`${ui.statement} ${ui.cinematicChapter}`} id="story"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">01</span>
        <span className={ui.eyebrow}>DESIGN PRINCIPLE / 02</span>
        <h2>Not an accessory.<br/><em>A finishing detail.</em></h2>
        <p>Quiet enough to belong. Distinct enough to make the device unmistakably yours.</p>
      </section>

      <section className={`${ui.scanStory} ${ui.cinematicChapter}`} aria-labelledby="scan-story-title"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">02</span>
        <div className={ui.scanCopy}>
          <span className={ui.eyebrow}>THE MOMENT / 02</span>
          <h2 id="scan-story-title">Tap the tag.<br/><em>Meet the owner.</em></h2>
          <p>ShieldTag is designed around a simple handoff: a device is found, its identity surface is opened, and the finder gets the owner-approved path forward.</p>
          <div className={ui.scanSteps}><span><b>01</b>Find the device</span><span><b>02</b>Open ShieldTag</span><span><b>03</b>Use the approved contact path</span></div>
          <a href="/products">Explore ShieldTag →</a>
        </div>
        <div className={ui.scanStage} aria-hidden="true">
          <div className={ui.scanPhone}><div className={ui.scanIsland}/><div className={ui.scanScreen}><Logo/><small>RADVORA SHIELDTAG</small><b>Owner connection</b><p>Contact details appear only through the configured owner experience.</p><span>OPEN OWNER PATH</span></div></div>
          <div className={ui.scanSignal}><i/><i/><i/></div><div className={ui.scanBadge}><Tag finish={finishes[0]} label="SIGNATURE"/></div>
        </div>
      </section>

      <section className={`${ui.formats} ${ui.cinematicChapter}`} id="formats"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">03</span>
        <div className={ui.sectionHead}><span className={ui.eyebrow}>FORM FACTOR / 03</span><h2>Built to belong<br/>on the object.</h2><p>Four ShieldTag expressions keep the visual language consistent while respecting the scale of different device classes.</p></div>
        <div className={ui.formatRail}>{formats.map((item,i)=><article key={item.name}><span>{item.n}</span><div className={ui.formatTag} style={{'--scale':`${1-i*.11}`} as CSSProperties}><Tag finish={finishes[i]} label={item.name.toUpperCase()}/></div><small>{item.device}</small><h3>{item.name}</h3><p>{item.copy}</p></article>)}</div>
      </section>

      <div className={ui.labChapter}><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">04</span><ShieldLab onSaved={setSavedBuildLabel}/></div>

      <section className={`${ui.finishStory} ${ui.cinematicChapter}`} id="finishes"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">05</span>
        <div className={ui.sectionHead}><span className={ui.eyebrow}>MATERIAL / 05</span><h2>Finish is part<br/>of the device.</h2><p>Neutral, metallic and expressive directions let the tag disappear into the hardware or become its deliberate signature.</p></div>
        <div className={ui.finishShowcase}>{finishes.slice(0,4).map((finish,i)=><article key={finish.id} style={{'--finish-bg':finish.base,'--finish-edge':finish.edge} as CSSProperties}><span>0{i+1}</span><div><Tag finish={finish} label="SIGNATURE"/></div><h3>{finish.name}</h3></article>)}</div>
      </section>

      <section className={`${ui.macro} ${ui.cinematicChapter}`}><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">06</span><div className={ui.macroCopy}><span className={ui.eyebrow}>DETAIL / 06</span><h2>Designed at<br/>the edge.</h2><p>The visual system uses a fine perimeter, layered face and restrained identity mark so the tag reads like hardware rather than a sticker.</p></div><div className={ui.macroStage}><div className={ui.macroTag}><Tag finish={finishes[1]} label="SIGNATURE"/></div><span>EDGE / FACE / IDENTITY</span></div></section>

      <section className={`${ui.install} ${ui.cinematicChapter}`}><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">07</span><div><span className={ui.eyebrow}>PLACEMENT / 07</span><h2>A deliberate<br/>final position.</h2><p>Preview the visual language here, then confirm the exact supported device and fit before purchase.</p><a href="/compatibility">Verify your exact model →</a></div><div className={ui.installDiagram} aria-hidden="true"><div className={ui.installPhone}/><div className={ui.installGuide}/><div className={ui.installTag}><Tag finish={finishes[2]} label="SIGNATURE"/></div><span>ALIGN</span></div></section>

      <section className={`${ui.privacyStory} ${ui.cinematicChapter}`} aria-labelledby="privacy-story-title"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">08</span>
        <div className={ui.privacyHead}><span className={ui.eyebrow}>OWNER CONTROL / 08</span><h2 id="privacy-story-title">A finder gets a path.<br/><em>Not your whole profile.</em></h2><p>The public interaction is framed around the owner-configured experience. What is available to a finder depends on that configured path; the design does not promise automatic disclosure of private details.</p></div>
        <div className={ui.privacyCompare}>
          <article><small>FINDER EXPERIENCE</small><h3>A clear next step.</h3><p>ShieldTag can direct the finder into the configured owner experience so they know how to proceed.</p><span>OWNER-CONFIGURED PATH</span></article>
          <div className={ui.privacyCore}><Logo/><b>CONTROL<br/>STAYS<br/>CENTRAL</b><i/></div>
          <article><small>PRIVACY BOUNDARY</small><h3>No blanket exposure.</h3><p>The presentation does not treat personal contact information as automatically public or universally available.</p><span>NO AUTOMATIC DISCLOSURE CLAIM</span></article>
        </div>
      </section>

      <section className={`${ui.lifeStory} ${ui.cinematicChapter}`} aria-labelledby="life-story-title"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">09</span>
        <div className={ui.lifeHead}><span className={ui.eyebrow}>EVERYDAY TECH / 09</span><h2 id="life-story-title">One visual language.<br/><em>Across what you carry.</em></h2><p>ShieldTag is conceived as a family of identity details for personal technology. These scenes show the design intent; exact compatibility remains a separate verification step.</p></div>
        <div className={ui.lifeGrid}>
          <article className={ui.lifePhone}><div className={ui.lifeDevice}><div className={ui.lifePhoneBody}><span/><div><Tag finish={finishes[0]} label="SIGNATURE"/></div></div></div><div className={ui.lifeCopy}><small>PHONE / DAILY CARRY</small><h3>The thing you reach for first.</h3><p>A compact identity detail intended to sit quietly with the phone rather than compete with it.</p></div></article>
          <article className={ui.lifeLaptop}><div className={ui.lifeDevice}><div className={ui.lifeLaptopLid}><Logo/><div><Tag finish={finishes[1]} label="EXECUTIVE"/></div></div></div><div className={ui.lifeCopy}><small>LAPTOP / WORKDAY</small><h3>Professional, not promotional.</h3><p>The wider format is styled as a restrained hardware plaque for the computer that moves between work and travel.</p></div></article>
          <article className={ui.lifeAccessory}><div className={ui.lifeDevice}><div className={ui.lifeCase}><i/><div><Tag finish={finishes[2]} label="MINI"/></div></div></div><div className={ui.lifeCopy}><small>ACCESSORIES / SMALL TECH</small><h3>The same identity, scaled down.</h3><p>A smaller visual expression keeps compact personal technology inside the same ShieldTag language.</p></div></article>
        </div>
      </section>

      <section className={`${ui.trust} ${ui.cinematicChapter}`} aria-label="ShieldTag trust principles"><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">10</span>
        <article><span>01 / FIT</span><h3>Verify before you choose.</h3><p>Every styling preview stays separate from compatibility. Exact model fit is confirmed through the compatibility system.</p><a href="/compatibility">Verify your model →</a></article>
        <article><span>02 / COMMERCE</span><h3>Buy only from live data.</h3><p>Price, tax, stock and checkout are shown only when approved commerce data is available for the product.</p><a href="/products">View current availability →</a></article>
        <article><span>03 / OWNERSHIP</span><h3>Make the build yours.</h3><p>Save your device-and-finish combination, return to it later, or share the same build without changing its fit status.</p><a href="#shieldlab">Build and save yours →</a></article>
      </section>

      <section className={ui.utilityLab}><LinkResolver/></section>

      <section className={`${ui.finalCta} ${ui.cinematicChapter}`}><span className={ui.chapterLine} aria-hidden="true"/><span className={ui.chapterNumber} aria-hidden="true">11</span><span className={ui.eyebrow}>MAKE IT YOURS / 11</span><h2>See it on your device.<br/><em>Then decide.</em></h2><p className={ui.finalLead}>Start with the look. Verify the exact model. Check governed availability only when you are ready.</p><div><a href="#shieldlab">Build your ShieldTag</a><a href="/compatibility">Verify exact fit</a></div></section>
    </main>

    <footer className={ui.footer}><div><Logo/><b>RADVORA</b></div><p>Device names and imagery explain styling context only. No manufacturer affiliation or endorsement is implied.</p><nav><a href="/products">Products</a><a href="/compatibility">Compatibility</a><a href="/support">Support</a><a href="/privacy">Privacy</a></nav></footer>
    <div className={ui.mobileDock} aria-label="ShieldTag quick actions"><a href="#shieldlab">Build yours</a><a href="/compatibility">Verify fit</a></div>
  </div>
}
