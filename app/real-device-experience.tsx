'use client'

import { CSSProperties, useMemo, useState } from 'react'
import ui from './real-device-experience.module.css'

type Finish={
  id:string
  name:string
  base:string
  edge:string
  accent:string
  text:string
}

type DeviceExample={
  id:string
  brand:string
  name:string
  category:'Smartphone'|'Tablet'|'Laptop'|'Accessory'
  deviceColor:string
  image:string
  fit:'contain'|'cover'
  tone:string
  syncFinish:Finish
}

const finishes:Finish[]=[
  {id:'obsidian',name:'Obsidian',base:'#0b0d10',edge:'#5d6670',accent:'#86e9ff',text:'#f8fbfd'},
  {id:'titanium',name:'Titanium',base:'#adb4bb',edge:'#f3f6f8',accent:'#d8f8ff',text:'#111820'},
  {id:'graphite',name:'Graphite',base:'#30353b',edge:'#747f89',accent:'#9defff',text:'#f7fafc'},
  {id:'arctic',name:'Arctic',base:'#edf1f3',edge:'#ffffff',accent:'#baf3ff',text:'#15202a'},
  {id:'midnight',name:'Midnight',base:'#15273f',edge:'#5c7594',accent:'#7acaff',text:'#f7fbff'},
  {id:'rose',name:'Rose',base:'#9d7069',edge:'#deb7b0',accent:'#ffd0c5',text:'#fffaf8'},
  {id:'forest',name:'Forest',base:'#213d35',edge:'#6d8c82',accent:'#8ff0d4',text:'#f6fffb'},
  {id:'champagne',name:'Champagne',base:'#b99f73',edge:'#e7d4ae',accent:'#ffe4a8',text:'#211b12'}
]

const devices:DeviceExample[]=[
  {id:'iphone',brand:'Apple',name:'iPhone 17',category:'Smartphone',deviceColor:'Lavender',image:'https://www.apple.com/v/iphone-17/g/images/overview/product-viewer/colors_lavender__bcaie9a8npj6_large.jpg',fit:'contain',tone:'mist',syncFinish:{id:'lavender-sync',name:'Lavender Sync',base:'#c9bfd9',edge:'#f1eaf8',accent:'#e6d7ff',text:'#211b2b'}},
  {id:'galaxy',brand:'Samsung',name:'Galaxy S26',category:'Smartphone',deviceColor:'Silver Shadow',image:'https://images.samsung.com/is/image/samsung/p6pim/in/s2602/gallery/in-galaxy-s26-s942-578627-sm-s942bzscins-550888079?%24624_624_PNG%24=',fit:'contain',tone:'silver',syncFinish:{id:'silver-sync',name:'Silver Sync',base:'#aeb2b9',edge:'#eef1f4',accent:'#d9f7ff',text:'#11161c'}},
  {id:'oppo',brand:'OPPO',name:'Reno16 5G',category:'Smartphone',deviceColor:'Twilight Purple',image:'https://www.oppo.com/content/dam/oppo_com/common/mkt/v2-2/oppo-reno16-series-en/specs/reno16/light-purple-deep-purple-white.png',fit:'contain',tone:'purple',syncFinish:{id:'violet-sync',name:'Violet Sync',base:'#4d354f',edge:'#a781aa',accent:'#d9aee2',text:'#fff9ff'}},
  {id:'vivo',brand:'vivo',name:'V50',category:'Smartphone',deviceColor:'Starry Blue',image:'https://asia-exstatic-vivofs.vivo.com/PSee2l50xoirPK7y/1740991283302/e337d8e8bdec570993f6c7c4228af755.png',fit:'contain',tone:'blue',syncFinish:{id:'blue-sync',name:'Blue Sync',base:'#184c9d',edge:'#6aa3e8',accent:'#8fd5ff',text:'#f5fbff'}},
  {id:'ipad',brand:'Apple',name:'iPad Air',category:'Tablet',deviceColor:'Space Gray',image:'https://www.apple.com/v/ipad-air/ah/images/overview/closer-look/space-gray/slide_2B__dvqfqwnkj2c2_large.jpg',fit:'contain',tone:'blue',syncFinish:{id:'ipad-sync',name:'Space Gray Sync',base:'#68686b',edge:'#a8aaad',accent:'#c7edf7',text:'#f7fafb'}},
  {id:'tabs11',brand:'Samsung',name:'Galaxy Tab S11',category:'Tablet',deviceColor:'Gray',image:'https://images.samsung.com/is/image/samsung/assets/pe/tablets/galaxy-tab-s11/buy/TS11_Color_Selection_Gray_MO_720x480.png',fit:'contain',tone:'silver',syncFinish:{id:'tab-sync',name:'Graphite Sync',base:'#676b70',edge:'#b7bcc1',accent:'#c7edf7',text:'#f7fafb'}},
  {id:'macbook',brand:'Apple',name:'MacBook Air',category:'Laptop',deviceColor:'Silver',image:'https://www.apple.com/v/macbook-air/specs/b/images/specs/13-inch/mba_13_size1__eyfditb7ixea_large.jpg',fit:'contain',tone:'silver',syncFinish:{id:'mac-sync',name:'Silver Sync',base:'#b8bdc2',edge:'#f0f3f5',accent:'#d9f6ff',text:'#141a1f'}},
  {id:'xps',brand:'Dell',name:'XPS 13',category:'Laptop',deviceColor:'Platinum',image:'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-13-9350/spi/platinum/oled/notebook-xps-13-9350-oled-silver-campaign-hero-504x350-ng.psd?fmt=jpg&hei=400&wid=570',fit:'contain',tone:'silver',syncFinish:{id:'xps-sync',name:'Platinum Sync',base:'#b7babd',edge:'#f3f5f6',accent:'#d8f5ff',text:'#12191f'}},
  {id:'buds',brand:'Samsung',name:'Galaxy Buds3 FE Case',category:'Accessory',deviceColor:'Black',image:'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r420nzkainu/gallery/in-galaxy-buds3-fe-563497-sm-r420nzkainu-thumb-548868596?%24624_624_PNG%24=',fit:'contain',tone:'black',syncFinish:{id:'buds-sync',name:'Matte Black Sync',base:'#17191c',edge:'#545a61',accent:'#6ce7ff',text:'#f6fafc'}},
  {id:'powerbank',brand:'Samsung',name:'20,000mAh Battery Pack',category:'Accessory',deviceColor:'Beige',image:'https://images.samsung.com/is/image/samsung/p6pim/in/eb-p4520xuegin/gallery/in-battery-pack-20000mah-eb-p4520-eb-p4520xuegin-541529928?%241164_776_PNG%24=',fit:'contain',tone:'beige',syncFinish:{id:'beige-sync',name:'Warm Beige Sync',base:'#d3cbbd',edge:'#f6f1e7',accent:'#e8fbff',text:'#28231d'}}
]

const familyCards=[
  ['Signature','Smartphones','Compact proportions for modern phones.'],
  ['Pro','Tablets','Balanced scale for larger rear surfaces.'],
  ['Executive','Laptops','A restrained badge for premium computers.'],
  ['Mini','Accessories','A smaller format for compact technology.']
]

function Logo(){
  return <svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 6h58L43 22H24l-6 6h32L28 44l-8-9 9-10H10L2 17 25 6Z" fill="currentColor"/><path d="M33 22h20L39 35l-10-9 4-4Z" fill="currentColor" opacity=".45"/></svg>
}

function Tag({finish,label='SHIELDTAG'}:{finish:Finish;label?:string}){
  const style={'--tag-base':finish.base,'--tag-edge':finish.edge,'--tag-accent':finish.accent,'--tag-text':finish.text} as CSSProperties
  return <div className={ui.tag} style={style}>
    <div className={ui.tagRim}/>
    <div className={ui.tagFace}><Logo/><span><b>RADVORA</b><small>{label}</small></span><i/></div>
  </div>
}

function DeviceVisual({device,finish,priority=false}:{device:DeviceExample;finish:Finish;priority?:boolean}){
  const [failed,setFailed]=useState(false)
  return <div className={`${ui.deviceVisual} ${ui[`tone_${device.tone}`]} ${ui[`category_${device.category.toLowerCase()}`]}`}>
    <div className={ui.deviceGlow}/>
    {!failed
      ? <img src={device.image} alt={`${device.brand} ${device.name} styling preview`} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" draggable={false} onError={()=>setFailed(true)}/>
      : <div className={ui.deviceFallback}><Logo/><b>{device.brand}</b><span>{device.name}</span></div>}
    <div className={ui.tagAnchor}><Tag finish={finish} label={device.category==='Laptop'?'EXECUTIVE':device.category==='Tablet'?'PRO':device.category==='Accessory'?'MINI':'SIGNATURE'}/></div>
  </div>
}

function DeviceMatcher(){
  const [category,setCategory]=useState<DeviceExample['category']>('Smartphone')
  const initialByCategory:Record<DeviceExample['category'],string>={Smartphone:'iphone',Tablet:'ipad',Laptop:'macbook',Accessory:'buds'}
  const [deviceId,setDeviceId]=useState(initialByCategory.Smartphone)
  const [finishId,setFinishId]=useState('obsidian')

  const categoryDevices=useMemo(()=>devices.filter(d=>d.category===category),[category])
  const selected=useMemo(()=>categoryDevices.find(d=>d.id===deviceId)??categoryDevices[0],[categoryDevices,deviceId])
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]

  function chooseCategory(next:DeviceExample['category']){
    setCategory(next)
    setDeviceId(initialByCategory[next])
  }

  return <section className={ui.matcher} id="match">
    <div className={ui.matcherCopy}>
      <span className={ui.eyebrow}>FIND YOUR MATCH</span>
      <h2>See one device.<br/><em>Make one decision.</em></h2>
      <p>Choose a device context and a finish. This preview is for appearance only; exact fit remains model-specific and must be confirmed in the compatibility guide.</p>

      <div className={ui.categoryTabs} role="tablist" aria-label="Device categories">
        {(['Smartphone','Tablet','Laptop','Accessory'] as DeviceExample['category'][]).map(item=>
          <button type="button" role="tab" aria-selected={category===item} className={category===item?ui.tabActive:''} key={item} onClick={()=>chooseCategory(item)}>{item}</button>
        )}
      </div>

      <label className={ui.field}>
        <span>Device example</span>
        <select value={selected.id} onChange={e=>setDeviceId(e.target.value)}>
          {categoryDevices.map(device=><option value={device.id} key={device.id}>{device.brand} · {device.name}</option>)}
        </select>
      </label>

      <div className={ui.finishGrid} aria-label="ShieldTag finish">
        {finishes.map(item=><button type="button" key={item.id} aria-pressed={finishId===item.id} className={finishId===item.id?ui.finishActive:''} onClick={()=>setFinishId(item.id)}>
          <i style={{'--swatch':item.base,'--edge':item.edge} as CSSProperties}/>
          <span>{item.name}</span>
        </button>)}
      </div>

      <div className={ui.matcherNote}>
        <b>Compatibility confirmation required</b>
        <span>Visual styling does not automatically confirm model-level fit.</span>
      </div>
    </div>

    <div className={ui.matcherStage} aria-live="polite">
      <div className={ui.stageMeta}><span>{selected.category}</span><b>{selected.brand} {selected.name}</b><small>{selected.deviceColor} · {finish.name}</small></div>
      <DeviceVisual device={selected} finish={finish}/>
    </div>
  </section>
}

function ProductFamily(){
  return <section className={ui.family} id="products">
    <div className={ui.sectionHead}>
      <span className={ui.eyebrow}>THE SHIELDTAG FAMILY</span>
      <h2>One visual language.<br/><em>Four useful formats.</em></h2>
      <p>Each format changes proportion for the hardware around it instead of forcing one badge size onto every device.</p>
    </div>
    <div className={ui.familyGrid}>{familyCards.map(([name,forText,copy],index)=>
      <article key={name}>
        <span>0{index+1}</span>
        <div className={ui.familyTag}><Tag finish={finishes[index]} label={name.toUpperCase()}/></div>
        <small>{forText}</small>
        <h3>ShieldTag {name}</h3>
        <p>{copy}</p>
      </article>
    )}</div>
  </section>
}

function Installation(){
  const steps=[
    ['01','Clean','Prepare a clean, dry, compatible surface.'],
    ['02','Peel','Lift ShieldTag carefully from its backing.'],
    ['03','Align','Stay clear of cameras, vents, ports, buttons and hinges.'],
    ['04','Press','Apply even pressure and inspect the edges.']
  ]
  return <section className={ui.install} id="how">
    <div className={ui.sectionHead}>
      <span className={ui.eyebrow}>HOW IT WORKS</span>
      <h2>Quietly simple.<br/><em>Deliberately placed.</em></h2>
    </div>
    <div className={ui.steps}>{steps.map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
  </section>
}

export default function RealDeviceExperience(){
  const heroDevice=devices[0]
  return <div className={ui.page}>
    <header className={ui.nav}>
      <a className={ui.brand} href="/" aria-label="RADVORA home"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a>
      <nav aria-label="Primary"><a href="#products">Products</a><a href="#match">Find your match</a><a href="#how">How it works</a><a href="/compatibility">Compatibility</a></nav>
      <a className={ui.navCta} href="#match">Build your match</a>
    </header>

    <main>
      <section className={ui.hero}>
        <div className={ui.heroCopy}>
          <span className={ui.eyebrow}>PREMIUM DEVICE IDENTITY</span>
          <h1>Designed to<br/><em>belong.</em></h1>
          <p>RADVORA ShieldTag is a precision identity badge designed to sit naturally beside the technology you already own.</p>
          <div className={ui.heroActions}><a href="#match">Find your match</a><a href="#products">Explore the family</a></div>
          <div className={ui.heroFacts}><span>Device-aware proportions</span><span>Eight finish directions</span><span>Model-specific compatibility</span></div>
        </div>
        <div className={ui.heroStage}>
          <div className={ui.heroWord}>SHIELDTAG</div>
          <div className={ui.heroProduct}><DeviceVisual device={heroDevice} finish={heroDevice.syncFinish} priority/></div>
          <div className={ui.heroStageLabel}><span>SHIELDTAG SIGNATURE</span><b>Lavender Sync</b></div>
        </div>
      </section>

      <section className={ui.principles} aria-label="ShieldTag principles">
        <div><b>01</b><span>Choose the hardware context.</span></div>
        <div><b>02</b><span>Tune the finish.</span></div>
        <div><b>03</b><span>Verify the exact model.</span></div>
      </section>

      <ProductFamily/>
      <DeviceMatcher/>
      <Installation/>

      <section className={ui.compatibility}>
        <div>
          <span className={ui.eyebrow}>COMPATIBILITY FIRST</span>
          <h2>Preview freely.<br/><em>Verify precisely.</em></h2>
        </div>
        <div className={ui.compatCopy}>
          <p>Device imagery on this site explains styling and placement context. It does not create a manufacturer affiliation and it does not confirm fit for an unreviewed model.</p>
          <a href="/compatibility">Check compatibility →</a>
        </div>
      </section>

      <section className={ui.finalCta}>
        <span className={ui.eyebrow}>RADVORA SHIELDTAG</span>
        <h2>Make the device yours.<br/><em>Without fighting the design.</em></h2>
        <a href="#match">Build your match</a>
      </section>
    </main>

    <footer className={ui.footer}>
      <a className={ui.brand} href="/" aria-label="RADVORA home"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a>
      <nav aria-label="Footer"><a href="/products">Products</a><a href="/compatibility">Compatibility</a><a href="/research">Research</a><a href="/support">Support</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav>
      <p>Device names and imagery are used only to explain styling context. No manufacturer affiliation or endorsement is implied.</p>
    </footer>
  </div>
}
