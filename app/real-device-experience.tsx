'use client'

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import ui from './real-device-experience.module.css'

type Finish={id:string;name:string;base:string;edge:string;accent:string;text:string}
type DeviceExample={id:string;brand:string;name:string;category:string;deviceColor:string;image:string;source:string;tagClass:string;fit:'contain'|'cover';tone:string;syncFinish:Finish;placement?:{left:string;bottom:string;scale:number}}
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
  {id:'iphone',brand:'Apple',name:'iPhone 17',category:'Smartphone',deviceColor:'Lavender',image:'https://www.apple.com/v/iphone-17/g/images/overview/product-viewer/colors_lavender__bcaie9a8npj6_large.jpg',source:'https://www.apple.com/in/iphone-17/',tagClass:'tagIphone',fit:'contain',tone:'mist',syncFinish:{id:'lavender-sync',name:'Lavender Sync',base:'#c9bfd9',edge:'#f1eaf8',accent:'#e6d7ff',text:'#211b2b'}},
  {id:'galaxy',brand:'Samsung',name:'Galaxy S26',category:'Smartphone',deviceColor:'Silver Shadow',image:'https://images.samsung.com/is/image/samsung/p6pim/in/s2602/gallery/in-galaxy-s26-s942-578627-sm-s942bzscins-550888079?%24624_624_PNG%24=',source:'https://www.samsung.com/in/smartphones/galaxy-s26/',tagClass:'tagGalaxy',fit:'contain',tone:'silver',syncFinish:{id:'silver-sync',name:'Silver Shadow Sync',base:'#aeb2b9',edge:'#eef1f4',accent:'#d9f7ff',text:'#11161c'}},
  {id:'oppo',brand:'OPPO',name:'Reno16 5G',category:'Smartphone',deviceColor:'Twilight Purple',image:'https://www.oppo.com/content/dam/oppo_com/common/mkt/v2-2/oppo-reno16-series-en/specs/reno16/light-purple-deep-purple-white.png',source:'https://www.oppo.com/in/smartphones/series-reno/reno16/specs/',tagClass:'tagOppo',fit:'contain',tone:'purple',syncFinish:{id:'violet-sync',name:'Twilight Violet Sync',base:'#4d354f',edge:'#a781aa',accent:'#d9aee2',text:'#fff9ff'}},
  {id:'vivo',brand:'vivo',name:'V50',category:'Smartphone',deviceColor:'Starry Blue',image:'https://asia-exstatic-vivofs.vivo.com/PSee2l50xoirPK7y/1740991283302/e337d8e8bdec570993f6c7c4228af755.png',source:'https://www.vivo.com/en/products/picture/v50',tagClass:'tagVivo',fit:'contain',tone:'blue',syncFinish:{id:'blue-sync',name:'Starry Blue Sync',base:'#184c9d',edge:'#6aa3e8',accent:'#8fd5ff',text:'#f5fbff'}},
  {id:'ipad',brand:'Apple',name:'iPad Air',category:'Tablet',deviceColor:'Space Gray',image:'https://www.apple.com/v/ipad-air/ah/images/overview/closer-look/space-gray/slide_2B__dvqfqwnkj2c2_large.jpg',source:'https://www.apple.com/in/ipad-air/',tagClass:'tagIpad',fit:'contain',tone:'blue',syncFinish:{id:'ipad-graphite-sync',name:'Space Gray Sync',base:'#68686b',edge:'#a8aaad',accent:'#c7edf7',text:'#f7fafb'}},
  {id:'tabs11',brand:'Samsung',name:'Galaxy Tab S11',category:'Tablet',deviceColor:'Gray',image:'https://images.samsung.com/is/image/samsung/assets/pe/tablets/galaxy-tab-s11/buy/TS11_Color_Selection_Gray_MO_720x480.png',source:'https://www.samsung.com/in/tablets/galaxy-tab-s/galaxy-tab-s11-gray-128gb-sm-x736bzaainu/',tagClass:'tagTabS11',fit:'contain',tone:'silver',syncFinish:{id:'tab-gray-sync',name:'Graphite Gray Sync',base:'#676b70',edge:'#b7bcc1',accent:'#c7edf7',text:'#f7fafb'},placement:{left:'50%',bottom:'18%',scale:.72}},
  {id:'macbook',brand:'Apple',name:'MacBook Air',category:'Laptop',deviceColor:'Silver',image:'https://www.apple.com/v/macbook-air/specs/b/images/specs/13-inch/mba_13_size1__eyfditb7ixea_large.jpg',source:'https://www.apple.com/in/macbook-air/specs/',tagClass:'tagMac',fit:'contain',tone:'silver',syncFinish:{id:'mac-silver-sync',name:'Silver Alloy Sync',base:'#b8bdc2',edge:'#f0f3f5',accent:'#d9f6ff',text:'#141a1f'}},
  {id:'xps',brand:'Dell',name:'XPS 13',category:'Laptop',deviceColor:'Platinum',image:'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-13-9350/spi/platinum/oled/notebook-xps-13-9350-oled-silver-campaign-hero-504x350-ng.psd?fmt=jpg&hei=400&wid=570',source:'https://www.dell.com/en-in/shop/laptop-notebook-computers/new-xps-13-laptop-2026/spd/xps13dx13260laptop',tagClass:'tagXps',fit:'contain',tone:'silver',syncFinish:{id:'xps-platinum-sync',name:'Platinum Sync',base:'#b7babd',edge:'#f3f5f6',accent:'#d8f5ff',text:'#12191f'},placement:{left:'54%',bottom:'22%',scale:.66}},
  {id:'omnibook',brand:'HP',name:'OmniBook Ultra 14',category:'Laptop',deviceColor:'Silk Sand',image:'https://www.hp.com/in-en/shop/media/catalog/product/h/p/hp-omnibook-ultra-14-ngai-grahami-silk-sand-front.png?auto=avif&bg-color=ffffff&fit=bounds&format=jpg&image-type=image&quality=100&store=in-en&type=image-product&width=960',source:'https://www.hp.com/in-en/shop/products/laptops/hp-omnibook-ultra-laptop-next-gen-ai-14-kd0083tu-dg0v4pa-acj',tagClass:'tagOmni',fit:'contain',tone:'sand',syncFinish:{id:'hp-silk-sync',name:'Silk Sand Sync',base:'#b9aa96',edge:'#ede3d4',accent:'#d9f6ff',text:'#211c17'},placement:{left:'50%',bottom:'21%',scale:.64}},
  {id:'galaxybook',brand:'Samsung',name:'Galaxy Book5 Pro',category:'Laptop',deviceColor:'Gray',image:'https://images.samsung.com/is/image/samsung/assets/hk_en/galaxy-book5/galaxy-book5/ImageCarousel_UK_Gray_PC.jpg',source:'https://www.samsung.com/in/business/computers/galaxy-book/galaxy-book5-pro-14-inch-ultra-5-16gb-512gb-np940xha-lg1in/',tagClass:'tagGalaxyBook',fit:'contain',tone:'silver',syncFinish:{id:'book-gray-sync',name:'Graphite Gray Sync',base:'#6b6d70',edge:'#b8bdc2',accent:'#d7f5ff',text:'#f8fbfc'},placement:{left:'67%',bottom:'22%',scale:.62}},
  {id:'zenbook',brand:'ASUS',name:'Zenbook S 14',category:'Laptop',deviceColor:'Scandinavian White',image:'https://dlcdnwebimgs.asus.com/files/media/202509/386c0216-2d72-4b65-ab20-d75532687a7d/v1/features/images/large/1x/s3/card_1.avif',source:'https://www.asus.com/in/laptops/for-home/zenbook/asus-zenbook-s-14-ux5406/',tagClass:'tagZenbook',fit:'contain',tone:'white',syncFinish:{id:'zen-white-sync',name:'Scandinavian White Sync',base:'#deddd9',edge:'#ffffff',accent:'#bff4ff',text:'#1b2025'},placement:{left:'73%',bottom:'20%',scale:.60}},
  {id:'buds',brand:'Samsung',name:'Galaxy Buds3 FE Case',category:'Accessory',deviceColor:'Black',image:'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r420nzkainu/gallery/in-galaxy-buds3-fe-563497-sm-r420nzkainu-thumb-548868596?%24624_624_PNG%24=',source:'https://www.samsung.com/in/audio-sound/galaxy-buds/galaxy-buds3-fe-black-sm-r420nzkainu/',tagClass:'tagBuds',fit:'contain',tone:'black',syncFinish:{id:'buds-black-sync',name:'Matte Black Sync',base:'#17191c',edge:'#545a61',accent:'#6ce7ff',text:'#f6fafc'}},
  {id:'powerbank',brand:'Samsung',name:'20,000mAh Battery Pack',category:'Accessory',deviceColor:'Beige',image:'https://images.samsung.com/is/image/samsung/p6pim/in/eb-p4520xuegin/gallery/in-battery-pack-20000mah-eb-p4520-eb-p4520xuegin-541529928?%241164_776_PNG%24=',source:'https://www.samsung.com/in/mobile-accessories/battery-pack-20-000mah-beige-eb-p4520xuegin/',tagClass:'tagPower',fit:'contain',tone:'beige',syncFinish:{id:'beige-sync',name:'Warm Beige Sync',base:'#d3cbbd',edge:'#f6f1e7',accent:'#e8fbff',text:'#28231d'}}
]

const families:Family[]=[
  {id:'signature',name:'ShieldTag Signature',for:'Smartphones',copy:'Compact, precise and visually balanced for modern phones.',deviceId:'iphone',label:'SIGNATURE'},
  {id:'pro',name:'ShieldTag Pro',for:'Tablets',copy:'A larger format proportioned for tablet backs and cases.',deviceId:'ipad',label:'PRO'},
  {id:'executive',name:'ShieldTag Executive',for:'Laptops',copy:'A restrained plaque-style identity badge for premium computers.',deviceId:'macbook',label:'EXECUTIVE'},
  {id:'mini',name:'ShieldTag Mini',for:'Compact accessories',copy:'A reduced-format badge for small compatible surfaces.',deviceId:'buds',label:'MINI'},
  {id:'utility',name:'ShieldTag Utility',for:'Universal technology',copy:'A flexible format for supported electronics and asset contexts.',deviceId:'powerbank',label:'UTILITY'}
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

function DeviceVisual({device,finish,label='SHIELDTAG',priority=false,interactive=false,useDeviceFinish=true,showTag=true}:{device:DeviceExample;finish?:Finish;label?:string;priority?:boolean;interactive?:boolean;useDeviceFinish?:boolean;showTag?:boolean}){
  const [imageFailed,setImageFailed]=useState(false)
  const appliedFinish=useDeviceFinish?device.syncFinish:(finish??device.syncFinish)
  return <div className={`${ui.deviceVisual} ${ui[`device_${device.id}`]} ${ui[`tone_${device.tone}`]} ${interactive?ui.deviceInteractive:''} ${imageFailed?ui.deviceImageFailed:''}`}>
    <div className={ui.deviceImageFrame}>{!imageFailed?<img src={device.image} alt={`${device.brand} ${device.name} rear view with RADVORA ShieldTag placement preview`} loading={priority?'eager':'lazy'} decoding="async" className={device.fit==='cover'?ui.imageCover:ui.imageContain} onError={()=>setImageFailed(true)}/>:<div className={ui.deviceFallback} role="img" aria-label={`${device.brand} ${device.name} image temporarily unavailable`}><Logo/><span><b>{device.brand}</b><small>{device.category}</small></span></div>}</div>
    {showTag&&<div className={`${ui.tagAnchor} ${ui[device.tagClass]}`} style={device.placement?{left:device.placement.left,bottom:device.placement.bottom,transform:`translateX(-50%) scale(${device.placement.scale})`}:undefined}><Tag finish={appliedFinish} label={label} mini={device.category==='Accessory'}/></div>}
    <div className={ui.deviceGloss}/>
  </div>
}

function labelForDevice(device:DeviceExample){return device.category==='Laptop'?'EXECUTIVE':device.category==='Tablet'?'PRO':device.id==='powerbank'?'UTILITY':device.category==='Accessory'?'MINI':'SIGNATURE'}

function HeroWave(){
  const wave=['iphone','galaxy','oppo','vivo','ipad','macbook','buds','powerbank']
  const stageRef=useRef<HTMLDivElement>(null)
  const [progress,setProgress]=useState(.42)

  useEffect(()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)')
    if(reduce.matches){setProgress(.5);return}
    let frame=0
    const update=()=>{
      const stage=stageRef.current
      if(!stage)return
      const rect=stage.getBoundingClientRect()
      const viewport=window.innerHeight||1
      const raw=(viewport-rect.top)/(viewport+rect.height)
      setProgress(Math.max(0,Math.min(1,raw)))
    }
    const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)}
    update()
    window.addEventListener('scroll',onScroll,{passive:true})
    window.addEventListener('resize',onScroll)
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)}
  },[])

  return <div ref={stageRef} className={ui.waveStage} aria-label="Cinematic real-device wave with RADVORA ShieldTag overlays">
    <div className={ui.waveAtmosphere}/><div className={ui.waveBeam}/><div className={ui.waveBeamAlt}/><div className={ui.waveHalo}/>
    {wave.map((id,index)=>{
      const d=devices.find(x=>x.id===id)!
      const label=labelForDevice(d)
      const center=(wave.length-1)/2
      const offset=index-center
      const normalized=offset/center
      const x=offset*105-(progress-.5)*92
      const y=Math.sin(index*.82)*64+Math.sin(progress*Math.PI*2+index*.48)*10
      const z=Math.cos(normalized*Math.PI/2)*150-Math.abs(offset)*14
      const ry=normalized*-18+(progress-.5)*10
      const rz=normalized*2.8
      const scale=.89+(1-Math.abs(normalized))*.13
      const style={
        '--wave-x':`${x}px`,
        '--wave-y':`${y}px`,
        '--wave-z':`${z}px`,
        '--wave-ry':`${ry}deg`,
        '--wave-rz':`${rz}deg`,
        '--wave-scale':scale,
        '--wave-delay':`${index*70}ms`,
        zIndex:Math.round(100+z)
      } as CSSProperties
      return <div key={id} className={ui.waveItem} style={style}>
        <div className={ui.waveCard}><DeviceVisual device={d} label={label} priority={index<2}/>
          <div className={ui.waveMeta}><div><b>{d.brand}</b><span>{d.name}</span></div><small>{d.deviceColor} · {d.syncFinish.name}</small></div>
        </div>
      </div>
    })}
    <div className={ui.waveCaption}><span>ONE CONTINUOUS DEVICE SYSTEM</span><b>Phone → tablet → laptop → accessories</b></div>
  </div>
}

function Ecosystem(){
  const categories=['Smartphone','Tablet','Laptop','Accessory']
  const [category,setCategory]=useState('Smartphone')
  const visible=devices.filter(d=>d.category===category)
  const brands=[...new Set(visible.map(d=>d.brand))]
  return <section className={ui.ecosystem} id="devices">
    <div className={ui.sectionIntro}><span>MADE FOR THE DEVICES YOU ALREADY USE</span><h2>Built for more than<br/><em>one ecosystem.</em></h2><p>Browse real device examples by category. ShieldTag proportions and finish direction change with the hardware, while exact model compatibility remains separately verified.</p></div>
    <div className={ui.categoryTabs} role="tablist" aria-label="Device categories">{categories.map(cat=>{const count=devices.filter(d=>d.category===cat).length;return <button key={cat} role="tab" aria-selected={category===cat} className={category===cat?ui.categoryTabActive:''} onClick={()=>setCategory(cat)}><span>{cat}</span><small>{count} examples</small></button>})}</div>
    <div className={ui.coverageBar}><div><span>{category.toUpperCase()} COVERAGE</span><b>{visible.length} device examples · {brands.length} brands</b></div><p>{brands.join(' · ')}</p></div>
    <div className={ui.ecoGrid}>{visible.map(d=><article key={d.id} className={ui.ecoCard}><div className={ui.ecoVisual}><DeviceVisual device={d} label={labelForDevice(d)}/></div><div className={ui.ecoInfo}><div><span>{d.category}</span><h3>{d.brand}</h3><p>{d.name} · {d.deviceColor}</p></div><div className={ui.syncNote}><small>COLOUR SYNC</small><b>{d.syncFinish.name}</b></div></div></article>)}</div>
  </section>
}

function FamilyGrid(){
  return <section className={ui.familySection} id="products"><div className={ui.sectionIntro}><span>THE SHIELDTAG FAMILY</span><h2>Designed around the device.<br/><em>Not forced onto it.</em></h2><p>Five form factors use the same restrained RADVORA visual language while changing scale and proportion for different device classes.</p></div><div className={ui.familyGrid}>{families.map((f,i)=>{const d=devices.find(x=>x.id===f.deviceId)!;return <article key={f.id} className={ui.familyCard}><div className={ui.familyIndex}>0{i+1}</div><div className={ui.familyVisual}><DeviceVisual device={d} label={f.label}/></div><div className={ui.familyCopy}><span>{f.for}</span><h3>{f.name}</h3><p>{f.copy}</p><a href="/compatibility">Check compatibility →</a></div></article>})}</div></section>
}

function FinishStudio({finishId,setFinishId}:{finishId:string;setFinishId:(id:string)=>void}){
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  const iphone=devices[0]
  return <section className={ui.finishSection} id="finishes"><div className={ui.finishCopy}><span>MATCH YOUR DEVICE</span><h2>Blend in.<br/><em>Stand out.</em></h2><p>Explore eight finish directions and choose whether ShieldTag should blend into the device or create a deliberate contrast.</p><div className={ui.finishMeta}><span>Selected finish</span><b>{finish.name}</b><p>Lighting, tag face and edge treatment update together so the finish reads as a material—not a flat colour chip.</p></div></div><div className={ui.finishStage} style={{'--finish-scene':finish.base} as CSSProperties}><div className={ui.finishDevice}><DeviceVisual device={iphone} finish={finish} label="SIGNATURE" interactive useDeviceFinish={false}/></div><div className={ui.finishLight}/><div className={ui.finishSwatches}>{finishes.map(f=><button key={f.id} className={f.id===finishId?ui.swatchActive:''} onClick={()=>setFinishId(f.id)} aria-pressed={f.id===finishId}><i style={{'--swatch':f.base,'--edge':f.edge} as CSSProperties}/><span>{f.name}</span></button>)}</div></div></section>
}

function DeviceMatcher({finishId,setFinishId}:{finishId:string;setFinishId:(id:string)=>void}){
  const [brand,setBrand]=useState('Apple')
  const [category,setCategory]=useState('Smartphone')
  const [deviceId,setDeviceId]=useState('iphone')
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  const availableBrands=useMemo(()=>[...new Set(devices.filter(d=>d.category===category).map(d=>d.brand))],[category])
  const availableDevices=useMemo(()=>devices.filter(d=>d.category===category&&d.brand===brand),[category,brand])
  const match=useMemo(()=>availableDevices.find(d=>d.id===deviceId)??availableDevices[0]??devices.find(d=>d.category===category)??devices[0],[deviceId,availableDevices,category])

  function selectCategory(next:string){
    const categoryDevices=devices.filter(d=>d.category===next)
    const nextBrand=categoryDevices[0]?.brand??'Apple'
    const nextDevice=categoryDevices.find(d=>d.brand===nextBrand)??categoryDevices[0]??devices[0]
    setCategory(next);setBrand(nextBrand);setDeviceId(nextDevice.id)
  }
  function selectBrand(next:string){
    const nextDevice=devices.find(d=>d.category===category&&d.brand===next)??devices.find(d=>d.category===category)??devices[0]
    setBrand(next);setDeviceId(nextDevice.id)
  }

  return <section className={ui.matcherSection} id="matcher">
    <div className={ui.matcherPanel}><div className={ui.matcherIntro}><span>FIND YOUR MATCH</span><h2>Build the visual match.</h2><p>Choose the device class, brand example, shown product, device colour and ShieldTag finish. Appearance can be previewed here; exact compatibility remains evidence-gated.</p><div className={ui.matcherCoverage}><b>{devices.filter(d=>d.category===category).length} {category.toLowerCase()} examples</b><span>{availableBrands.length} brands available in this preview</span></div></div>
      <div className={ui.matcherControls}>
        <label><span>01 Device category</span><select value={category} onChange={e=>selectCategory(e.target.value)}><option>Smartphone</option><option>Tablet</option><option>Laptop</option><option>Accessory</option></select></label>
        <label><span>02 Brand example</span><select value={brand} onChange={e=>selectBrand(e.target.value)}>{availableBrands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label><span>03 Device example</span><select value={deviceId} onChange={e=>setDeviceId(e.target.value)}>{availableDevices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label><span>04 Device colour shown</span><select value={match.deviceColor} disabled aria-label="Shown device colour"><option>{match.deviceColor}</option></select></label>
        <label><span>05 ShieldTag finish</span><select value={finishId} onChange={e=>setFinishId(e.target.value)}>{finishes.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <div className={ui.matcherStatus}><span>06 Compatibility status</span><b>Compatibility confirmation required</b><p>The preview does not claim model-level fit. Confirm the approved compatibility guide before purchase.</p></div>
      </div>
    </div>
    <div className={ui.matcherPreview} style={{'--matcher-glow':finish.base} as CSSProperties}>
      <DeviceVisual device={match} finish={finish} label={labelForDevice(match)} interactive useDeviceFinish={false}/>
      <div className={ui.matcherBadge}><span>VISUAL MATCH</span><b>{match.brand} · {match.name}</b><small>{match.deviceColor} → {finish.name}</small></div>
    </div>
  </section>
}

function ApplicationGallery(){
  return <section className={ui.gallerySection}><div className={ui.sectionIntro}><span>REAL-DEVICE APPLICATION GALLERY</span><h2>See it in context.<br/><em>Not in isolation.</em></h2><p>Every example keeps the ShieldTag away from obvious cameras, controls and critical hardware zones. Final placement remains subject to the approved compatibility guide.</p></div><div className={ui.galleryGrid}>{['iphone','galaxy','oppo','vivo','ipad','macbook','buds','powerbank'].map((id,i)=>{const d=devices.find(x=>x.id===id)!;return <figure key={id} className={`${ui.galleryCard} ${i===0||i===5?ui.galleryWide:''}`}><DeviceVisual device={d} label={labelForDevice(d)}/><figcaption><b>{d.brand} {d.name}</b><span>Compatibility illustration · placement preview</span></figcaption></figure>})}</div></section>
}

function BeforeAfter(){
  const [reveal,setReveal]=useState(54)
  const d=devices[0]
  return <section className={ui.beforeSection}><div className={ui.beforeCopy}><span>BEFORE / AFTER</span><h2>One device.<br/><em>One considered detail.</em></h2><p>Drag the control to compare the same rear-view device before and after its colour-matched RADVORA badge is applied.</p></div><div className={ui.compare} style={{'--reveal':`${reveal}%`} as CSSProperties}><div className={ui.compareBase}><DeviceVisual device={d} label="SIGNATURE" showTag={false}/></div><div className={ui.compareOverlay}><DeviceVisual device={d} label="SIGNATURE"/></div><div className={ui.compareLabels}><span>Before ShieldTag</span><span>With RADVORA</span></div><input aria-label="Compare device before and after ShieldTag" type="range" min="8" max="92" value={reveal} onChange={e=>setReveal(Number(e.target.value))}/><div className={ui.compareHandle}/></div></section>
}

function Installation({finish}:{finish:Finish}){
  const [step,setStep]=useState(0)
  const [playing,setPlaying]=useState(true)
  useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setStep(v=>(v+1)%installSteps.length),1900);return()=>window.clearInterval(id)},[playing])
  return <section className={ui.installSection} id="how"><div className={ui.installText}><span>ATTACH IN SECONDS</span><h2>Peel. Align.<br/><em>Press. Ready.</em></h2><p>A clear five-step application guide keeps placement simple, deliberate and away from functional hardware.</p><div className={ui.stepList}>{installSteps.map(([title,copy],i)=><button key={title} onClick={()=>{setStep(i);setPlaying(false)}} className={step===i?ui.stepActive:''}><span>0{i+1}</span><div><b>{title}</b><p>{copy}</p></div></button>)}</div></div><div className={ui.installDemo}><div className={ui.demoTop}><span>APPLICATION GUIDE</span><button onClick={()=>setPlaying(v=>!v)}>{playing?'Pause':'Play'}</button></div><div className={ui.demoStage} data-step={step}><div className={ui.demoPhone}><img src={devices[0].image} alt="Device used in animated ShieldTag application guide"/></div><div className={ui.demoCloth}/><div className={ui.demoBacking}/><div className={ui.demoTag}><Tag finish={devices[0].syncFinish} label="SIGNATURE"/></div><div className={ui.demoFinger}/><div className={ui.demoPulse}/></div><div className={ui.demoCaption}><b>{installSteps[step][0]}</b><p>{installSteps[step][1]}</p></div></div></section>
}

function VideoGallery({finish}:{finish:Finish}){
  const [active,setActive]=useState('apply')
  return <section className={ui.videoSection}><div className={ui.sectionIntro}><span>SEE SHIELDTAG IN MOTION</span><h2>Understand the fit.<br/><em>Before it reaches your device.</em></h2><p>Interactive motion previews make colour matching, placement and product proportions easier to understand at a glance.</p></div><div className={ui.videoGrid}>{videos.map(v=>{const d=devices.find(x=>x.id===v.device)!;const on=active===v.id;return <button key={v.id} className={`${ui.videoCard} ${on?ui.videoActive:''}`} onClick={()=>setActive(v.id)}><div className={ui.videoPoster}><DeviceVisual device={d} finish={finish} label={labelForDevice(d)} useDeviceFinish={v.id!=='match'}/><div className={ui.playDisc}>{on?'II':'▶'}</div><div className={ui.videoScan}/></div><div className={ui.videoCopy}><span>INTERACTIVE PREVIEW</span><h3>{v.title}</h3><p>{v.copy}</p></div></button>})}</div></section>
}

function Materials(){return <section className={ui.materialSection}><div className={ui.sectionIntro}><span>DESIGNED LIKE HARDWARE</span><h2>A precision identity badge.<br/><em>Not a generic sticker.</em></h2><p>Every visual detail is built around proportion, edge definition, restrained reflectivity and a finish that sits naturally beside premium devices.</p></div><div className={ui.materialGrid}><article><span>01</span><h3>Refined edges</h3><p>Chamfer-inspired geometry and controlled proportions create a hardware-led silhouette.</p></article><article><span>02</span><h3>Controlled reflectivity</h3><p>Matte, satin and metallic visual directions avoid exaggerated chrome and neon.</p></article><article><span>03</span><h3>Device-aware proportions</h3><p>Phone, tablet, laptop and Mini formats scale independently instead of forcing one sticker size everywhere.</p></article><article><span>04</span><h3>Validated performance only</h3><p>Durability and care claims are published only when final product testing supports them.</p></article></div></section>}

function Packaging({finish}:{finish:Finish}){return <section className={ui.packSection}><div className={ui.packVisual}><div className={ui.packShadow}/><div className={ui.packBox}><div className={ui.packLid}><Logo/><b>RADVORA</b><span>SHIELDTAG SIGNATURE</span><small>{finish.name.toUpperCase()}</small></div><div className={ui.packInner}><Tag finish={finish} label="SIGNATURE"/><p>Peel. Align. Press. Ready.</p><i>INSTALLATION GUIDE</i></div></div></div><div className={ui.packCopy}><span>PACKAGING EXPERIENCE</span><h2>Unbox it like premium technology.</h2><p>Dark graphite presentation, a precision product cradle and simple application guidance create a cleaner first impression than conventional sticker packaging.</p><div className={ui.packFacts}><div><b>Front</b><p>RADVORA · ShieldTag family · selected finish</p></div><div><b>Inside</b><p>Precision cradle · application card · installation guide</p></div><div><b>Back</b><p>Verified product, care and statutory information.</p></div></div></div></section>}

function Compatibility(){return <section className={ui.compatSection}><div><span>FIT & CARE</span><h2>Clear where it fits.<br/><em>Clear where it does not.</em></h2></div><div className={ui.compatCards}><article><b>Placement first</b><p>Keep away from cameras, vents, ports, buttons, charging contacts, hinges and other functional surfaces.</p></article><article><b>Check your model</b><p>Visual examples show appearance and placement direction. Exact compatibility remains model-specific.</p></article><article><b>Water resistance</b><p>A specific water-resistance rating will be published only after the final production product completes required validation. Until then, avoid immersion and prolonged water exposure.</p></article></div></section>}

function FAQ(){return <section className={ui.faq}><div className={ui.sectionIntro}><span>QUESTIONS / ANSWERED UP FRONT</span><h2>Clarity builds confidence.</h2></div><div className={ui.faqList}><details open><summary>How do I apply ShieldTag?</summary><p>Clean the compatible surface, peel carefully, align away from functional hardware, press evenly, then inspect the edges and follow the approved product guidance.</p></details><details><summary>Which devices are supported?</summary><p>The product family is being designed for smartphones, tablets, laptops and selected accessories. Exact model compatibility is confirmed only through the approved device guide.</p></details><details><summary>Can I match the ShieldTag to my device colour?</summary><p>Yes. The current design system includes eight visual finish directions so customers can preview either a close match or deliberate contrast.</p></details><details><summary>Is ShieldTag waterproof?</summary><p>A specific water-resistance rating will only be published after the final production version has completed the required validation. Until then, avoid immersion and prolonged water exposure.</p></details><details><summary>Can I remove and reapply it?</summary><p>Removal and reapplication characteristics will be published with the validated adhesive and production specification. They are not assumed here.</p></details><details><summary>Are Apple, Samsung, OPPO or vivo affiliated with RADVORA?</summary><p>No affiliation or endorsement is implied by the compatibility examples on this page. Manufacturer names and imagery are used to help customers understand device context.</p></details></div></section>}

export default function RealDeviceExperience(){
  const [finishId,setFinishId]=useState('obsidian')

  useEffect(()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sections=Array.from(document.querySelectorAll<HTMLElement>('main > section:not(:first-child)'))
    if(reduce){sections.forEach(section=>section.classList.add(ui.sectionVisible));return}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).classList.add(ui.sectionVisible);observer.unobserve(entry.target)}})
    },{threshold:.08,rootMargin:'0px 0px -6% 0px'})
    sections.forEach(section=>{section.classList.add(ui.sectionReveal);observer.observe(section)})
    return()=>observer.disconnect()
  },[])
  const finish=finishes.find(f=>f.id===finishId)??finishes[0]
  return <div className={ui.page}>
    <header className={ui.nav}><a className={ui.brand} href="/"><Logo/><span><b>RADVORA</b><small>SHIELDTAG</small></span></a><nav><a href="#devices">Devices</a><a href="#products">Products</a><a href="#finishes">Finishes</a><a href="#matcher">Find Your Match</a><a href="#how">How to Apply</a></nav><a className={ui.navCta} href="#matcher">Find Your Match <span>→</span></a></header>
    <main>
      <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>PREMIUM DEVICE IDENTITY</span><h1>One Shield.<br/><em>Every Device.</em></h1><p>RADVORA ShieldTag is a precision identity badge designed to complement the devices you already own—with device-aware proportions, rear-surface placement and finishes tuned to the hardware around it.</p><div className={ui.heroActions}><a href="#products">Explore ShieldTag <span>→</span></a><a className={ui.ghost} href="#how">See How It Works</a></div><div className={ui.heroProof}><span>Rear-mounted placement</span><span>Colour-synchronised finishes</span><span>Phone · tablet · laptop · accessories</span></div></div><HeroWave/></section>
      <Ecosystem/><FamilyGrid/><FinishStudio finishId={finishId} setFinishId={setFinishId}/><DeviceMatcher finishId={finishId} setFinishId={setFinishId}/><ApplicationGallery/><BeforeAfter/><Installation finish={finish}/><VideoGallery finish={finish}/><Materials/><Packaging finish={finish}/><Compatibility/><FAQ/>
      <section className={ui.finalCta}><span>RADVORA SHIELDTAG</span><h2>One Shield. Every Device.</h2><p>Find the ShieldTag designed to complement the technology you already own.</p><div><a href="#matcher">Find Your Match <span>→</span></a><a className={ui.ghost} href="#finishes">View Finishes</a><a className={ui.ghost} href="/compatibility">Compatibility Guide</a></div></section>
    </main>
    <footer className={ui.footer}><a className={ui.brand} href="/"><Logo/><span><b>RADVORA</b><small>ONE SHIELD. EVERY DEVICE.</small></span></a><div><a href="/products">Products</a><a href="/compatibility">Compatibility</a><a href="/support">Support</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div><p>Device imagery is used to illustrate fit and styling context. Trademarks belong to their respective owners; no endorsement or affiliation is implied.</p></footer>
  </div>
}
