'use client'

import { CSSProperties, useEffect, useMemo, useState } from 'react'
import ui from './real-device-experience.module.css'
import ProductInterestForm from './product-interest-form'

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
    const url=new URL(window.location.href)
    url.searchParams.set('device',deviceId)
    url.searchParams.set('finish',finishId)
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

  function chooseCategory(category:DeviceCategory){
    const first=devices.find(item=>item.category===category)
    if(first)setDeviceId(first.id)
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
    const url=new URL(window.location.href)
    url.searchParams.set('device',deviceId)
    url.searchParams.set('finish',finishId)
    url.hash='shieldlab'
    const share={title:'My RADVORA ShieldTag build',text:`${selected.brand} ${selected.name} · ${finish.name}`,url:url.toString()}
    try{
      if(navigator.share){await navigator.share(share);setMessage('Shared.')}
      else{await navigator.clipboard.writeText(share.url);setMessage('Build link copied.')}
    }catch{}
  }

  return <section className={ui.lab} id="shieldlab">
    <div className={ui.labStage} aria-live="polite" onPointerMove={handleStagePointerMove} onPointerLeave={resetStageDepth}>
      <div className={ui.stageMeta}><span>SHIELDLAB / LIVE PREVIEW</span><b>{selected.brand} {selected.name}</b><small>{selected.deviceColor} · {finish.name}</small></div>
      <DeviceVisual device={selected} finish={finish}/>
      <div className={ui.stageFooter}><span>{labelFor(selected.category)}</span><b>{finish.name}</b></div>
    </div>
    <div className={ui.labControls}>
      <span className={ui.eyebrow}>BUILD YOUR SHIELDTAG</span>
      <h2>One device.<br/><em>Your finish.</em></h2>
      <p>Choose a real device context, tune the finish, save the build and share the exact combination. Fit remains model-specific and is verified separately.</p>
      <div className={ui.categoryTabs} role="tablist" aria-label="Device categories">
        {(['Smartphone','Tablet','Laptop','Accessory'] as DeviceCategory[]).map(category=><button type="button" role="tab" aria-selected={selected.category===category} key={category} onClick={()=>chooseCategory(category)}>{category}</button>)}
      </div>
      <label className={ui.deviceSelect}><span>DEVICE</span><select value={selected.id} onChange={e=>setDeviceId(e.target.value)}>{categoryDevices.map(device=><option key={device.id} value={device.id}>{device.brand} · {device.name}</option>)}</select></label>
      <div className={ui.finishGrid} aria-label="Finish selector">{finishes.map(item=><button type="button" key={item.id} aria-pressed={finishId===item.id} onClick={()=>setFinishId(item.id)}><i style={{'--swatch':item.base,'--edge':item.edge} as CSSProperties}/><span>{item.name}</span></button>)}</div>
      <div className={ui.labActions}><button type="button" onClick={saveBuild}>Save build</button><button type="button" onClick={shareBuild}>Share build</button><a href="/compatibility">Verify fit →</a></div>
      <p className={ui.labStatus} role="status" aria-live="polite">{message||'Your device and finish are encoded in the page link.'}</p>
      <ProductInterestForm source="shieldlab-interest" context={`${selected.brand} ${selected.name} · ${finish.name}`} compact/>
    </div>
  </section>
}

export default function RealDeviceExperience(){
  const heroDevice=devices[0]
  const heroFinish=finishes[0]
  const [savedBuildLabel,setSavedBuildLabel]=useState<string|null>(null)

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

  return <div className={ui.page}>
    <header className={ui.nav}>
      <a className={ui.brand} href="/" aria-label="RADVORA home"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a>
      <nav aria-label="Primary"><a href="#formats">Formats</a><a href="#shieldlab">ShieldLab</a><a href="#finishes">Finishes</a><a href="/compatibility">Compatibility</a><a href="/products">Products</a><a href="/account">My RADVORA</a></nav>
      <a className={ui.navCta} href="#shieldlab">{savedBuildLabel?'Resume build':'Build yours'}</a>
    </header>

    <main>
      <section className={ui.hero}>
        <div className={ui.heroCopy}>
          <span className={ui.eyebrow}>ONE SHIELD. EVERY DEVICE.</span>
          <h1>Designed to<br/><em>belong.</em></h1>
          <p>RADVORA ShieldTag is a device identity system built around the hardware you already love—proportioned by device, styled by finish, verified by exact model.</p>
          <div className={ui.heroActions}><a href="#shieldlab">{savedBuildLabel?'Resume your saved build':'Build your ShieldTag'}</a><a href="/products">Explore the system</a></div>{savedBuildLabel?<p className={ui.savedBuildHint}>Saved on this device · {savedBuildLabel}</p>:null}
          <div className={ui.heroProof}><span>4 device formats</span><span>8 finish directions</span><span>Shareable builds</span></div>
        </div>
        <div className={ui.heroStage}>
          <div className={ui.heroGlow}/>
          <div className={ui.heroWord}>SHIELD</div>
          <DeviceVisual device={heroDevice} finish={heroFinish} priority/>
          <div className={ui.heroMeta}><span>Signature / Obsidian</span><b>01</b></div>
        </div>
      </section>

      <section className={ui.statement}>
        <span className={ui.eyebrow}>THE IDEA</span>
        <h2>It should look like it came<br/>with the device.</h2>
        <p>Not louder than the hardware. Not generic. Not one size forced everywhere.</p>
      </section>

      <section className={ui.formats} id="formats">
        <div className={ui.sectionIntro}><span className={ui.eyebrow}>THE SYSTEM</span><h2>Four proportions.<br/><em>One identity.</em></h2></div>
        <div className={ui.formatRail}>{formats.map((item,index)=><article key={item.name}>
          <span>{item.n}</span>
          <div className={ui.formatVisual}><Tag finish={finishes[index]} label={item.name.toUpperCase()}/></div>
          <small>{item.device}</small>
          <h3>ShieldTag {item.name}</h3>
          <p>{item.copy}</p>
          <a href="#shieldlab">Build this format →</a>
        </article>)}</div>
      </section>

      <ShieldLab onSaved={setSavedBuildLabel}/>

      <section className={ui.finishStory} id="finishes">
        <div className={ui.sectionIntro}><span className={ui.eyebrow}>FINISH STUDIO</span><h2>Blend in.<br/><em>Or stand apart.</em></h2><p>Eight visual directions let the ShieldTag disappear into the hardware or become the deliberate contrast.</p></div>
        <div className={ui.finishShowcase}>{finishes.map((finish,index)=><article key={finish.id}>
          <span>0{index+1}</span>
          <div className={ui.finishMacro}><Tag finish={finish} label="SHIELDTAG"/></div>
          <h3>{finish.name}</h3>
        </article>)}</div>
      </section>

      <section className={ui.macro}>
        <div className={ui.macroCopy}><span className={ui.eyebrow}>CLOSE-UP</span><h2>Small object.<br/>Serious presence.</h2><p>Every visible detail in the preview is about proportion, finish direction and the way the identity mark sits beside the device—not about unsupported performance claims.</p></div>
        <div className={ui.macroStage}>
          <div className={ui.macroTag}><Tag finish={finishes[1]} label="EXECUTIVE"/></div>
          <div className={ui.macroCalloutOne}><b>01</b><span>Face finish</span></div>
          <div className={ui.macroCalloutTwo}><b>02</b><span>Perimeter profile</span></div>
          <div className={ui.macroCalloutThree}><b>03</b><span>Identity line</span></div>
        </div>
      </section>

      <section className={ui.install}>
        <div><span className={ui.eyebrow}>INSTALLATION</span><h2>Clean. Align. Press.</h2></div>
        <p>Keep cameras, vents, ports, controls, hinges and charging contacts clear. Confirm the exact model before relying on placement guidance.</p>
        <a href="/installation">See installation guide →</a>
      </section>

      <section className={ui.trust}>
        <article><span>01</span><h3>Fit is model-specific.</h3><p>A styling preview never becomes a compatibility result by assumption.</p><a href="/compatibility">Check your device →</a></article>
        <article><span>02</span><h3>Availability is live-data controlled.</h3><p>Price, stock and checkout only appear when approved commerce data is configured.</p><a href="/products">See availability →</a></article>
        <article><span>03</span><h3>Your build can travel.</h3><p>Save it for later or share the exact device-and-finish combination with someone else.</p><a href="#shieldlab">Create a shareable build →</a></article>
      </section>

      <section className={ui.finalCta}>
        <span className={ui.eyebrow}>YOUR DEVICE. YOUR SHIELDTAG.</span>
        <h2>Build the one<br/><em>you would keep.</em></h2>
        <div><a href="#shieldlab">Open ShieldLab</a><a href="/products">Check availability</a></div>
      </section>
    </main>

    <nav className={ui.mobileDock} aria-label="Mobile quick actions"><a href="#shieldlab">{savedBuildLabel?'Resume build':'Build yours'}</a><a href="/account">My RADVORA</a></nav>

    <footer className={ui.footer}>
      <a className={ui.brand} href="/" aria-label="RADVORA home"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a>
      <nav aria-label="Footer"><a href="/products">Products</a><a href="/compatibility">Compatibility</a><a href="/account">My RADVORA</a><a href="/research">Research</a><a href="/support">Support</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav>
      <p>Device names and imagery explain styling context only. No manufacturer affiliation or endorsement is implied.</p>
    </footer>
  </div>
}
