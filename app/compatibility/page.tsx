'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

type Compatibility = {
  manufacturer: string
  device_family: string | null
  device_model: string
  region_variant: string | null
  compatibility_status: 'compatible' | 'limited' | 'not_compatible'
  installation_note: string | null
  evidence_note: string | null
}

const familyByCategory:Record<string,string>={
  Smartphone:'ShieldTag Signature',
  Tablet:'ShieldTag Pro',
  Laptop:'ShieldTag Executive',
  Accessory:'ShieldTag Mini'
}

function literalIlike(value:string){
  return value.trim().replace(/[\\%_]/g,'\\$&')
}

export default function CompatibilityPage(){
  const [category,setCategory]=useState('Smartphone')
  const [manufacturer,setManufacturer]=useState('')
  const [model,setModel]=useState('')
  const [variant,setVariant]=useState('')
  const [loading,setLoading]=useState(false)
  const [checked,setChecked]=useState(false)
  const [result,setResult]=useState<Compatibility | null>(null)
  const [lookupError,setLookupError]=useState(false)
  const [variantRequired,setVariantRequired]=useState(false)
  const suggestedFamily=useMemo(()=>familyByCategory[category]||'ShieldTag',[category])

  async function check(e:FormEvent){
    e.preventDefault()
    const manufacturerPattern=literalIlike(manufacturer)
    const modelPattern=literalIlike(model)
    const variantPattern=literalIlike(variant)
    if(!manufacturerPattern||!modelPattern)return
    setLoading(true)
    setChecked(false)
    setResult(null)
    setLookupError(false)
    setVariantRequired(false)
    try{
      const supabase=createClient()
      let query=supabase.from('device_compatibility')
        .select('manufacturer,device_family,device_model,region_variant,compatibility_status,installation_note,evidence_note')
        .ilike('manufacturer',manufacturerPattern)
        .ilike('device_model',modelPattern)
        .limit(2)
      if(variantPattern)query=query.ilike('region_variant',variantPattern)
      const {data,error}=await query
      if(error)throw error
      const matches=(data as Compatibility[]|null)??[]
      if(matches.length>1){setVariantRequired(true);setChecked(true);return}
      setResult(matches[0]??null)
      setChecked(true)
    }catch{
      setLookupError(true)
    }finally{
      setLoading(false)
    }
  }

  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}><span className={ui.kicker}>DEVICE COMPATIBILITY</span><h1>Check your<br/><em>exact device.</em></h1><p>Phone, tablet, laptop or accessory—the result stays model-specific. If RADVORA has not published a reviewed record for the exact manufacturer and model, the site shows it as not yet reviewed rather than guessing.</p></div>
      <aside className={ui.heroAside}><span>FAIL-CLOSED BY DESIGN</span><strong>Unknown is not confirmed compatible.</strong><p>A styling preview can help you visualise ShieldTag. This checker is the separate compatibility layer.</p><ul><li><span>Selected category</span><b>{category}</b></li><li><span>Suggested family</span><b>{suggestedFamily}</b></li><li><span>Unreviewed model</span><b>No assumption</b></li></ul></aside>
    </section>

    <section className={ui.section}><div className={ui.grid2}>
      <form className={`${ui.compatPanel} ${ui.compatForm}`} onSubmit={check}>
        <span className={ui.kicker}>FIND YOUR DEVICE</span>
        <label className={ui.label}>DEVICE CATEGORY<select className={ui.select} value={category} onChange={e=>{setCategory(e.target.value);setChecked(false);setResult(null);setLookupError(false);setVariantRequired(false)}}><option>Smartphone</option><option>Tablet</option><option>Laptop</option><option>Accessory</option></select></label>
        <div className={ui.fieldRow}><label className={ui.label}>MANUFACTURER<input className={ui.input} maxLength={80} value={manufacturer} onChange={e=>{setManufacturer(e.target.value);setVariantRequired(false)}} placeholder={category==='Laptop'?'Apple, Dell, HP, Samsung, ASUS…':'Apple, Samsung, OPPO, vivo…'}/></label><label className={ui.label}>EXACT MODEL<input className={ui.input} maxLength={120} value={model} onChange={e=>{setModel(e.target.value);setVariantRequired(false)}} placeholder={category==='Laptop'?'e.g. MacBook Air':'e.g. iPhone 17'}/></label></div><label className={ui.label}>REGION / VARIANT (OPTIONAL)<input className={ui.input} maxLength={120} value={variant} onChange={e=>{setVariant(e.target.value);setVariantRequired(false)}} placeholder="e.g. India, Global, Wi-Fi, 5G"/></label>
        <div className={ui.notice}>Visual examples elsewhere on RADVORA do not automatically mean compatibility. Enter the exact model here before relying on fit guidance.</div>
        <div className={ui.actions}><button className={ui.primary} type="submit" disabled={loading||!manufacturer.trim()||!model.trim()}>{loading?'Checking…':'Check compatibility →'}</button></div>
      </form>

      <aside className={ui.compatPanel} aria-live="polite">
        <span className={ui.status}>{lookupError?'LOOKUP UNAVAILABLE':variantRequired?'VARIANT REQUIRED':!checked?'AWAITING DEVICE':result?result.compatibility_status.replace('_',' ').toUpperCase():'NOT YET REVIEWED'}</span>
        <h3>{lookupError?'Compatibility service is temporarily unavailable.':variantRequired?'Multiple reviewed variants match this model.':!checked?'Compatibility status':result?`${result.manufacturer} ${result.device_model}`:'No published record for this exact device.'}</h3>
        {lookupError&&<p>Please try again shortly. RADVORA will not convert a service failure into a compatibility result.</p>}
        {!lookupError&&variantRequired&&<p>Add the region or hardware variant shown for your device, then check again. RADVORA will not guess between multiple reviewed records.</p>}
        {!lookupError&&!variantRequired&&!checked&&<p>Choose the category, manufacturer and exact model. The database result—not the visual matcher—controls compatibility status.</p>}
        {!lookupError&&!variantRequired&&checked&&!result&&<p>RADVORA has not published a reviewed compatibility record for this exact device yet. This is deliberately not treated as either compatible or incompatible.</p>}
        {result&&<div className={ui.resultGrid}><div><span>STATUS</span><b>{result.compatibility_status}</b></div><div><span>DEVICE FAMILY</span><b>{result.device_family||category}</b></div><div><span>REGION / VARIANT</span><b>{result.region_variant||'General'}</b></div><div><span>INSTALLATION</span><b>{result.installation_note||'Use approved guidance'}</b></div></div>}
      </aside>
    </div></section>
  </main></PublicShell>
}
