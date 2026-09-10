'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

type Compatibility = {
  manufacturer: string
  device_family: string | null
  device_model: string
  region_variant: string | null
  compatibility_status: 'compatible' | 'limited' | 'not_compatible'
  installation_note: string | null
  evidence_note: string | null
}

export default function CompatibilityPage(){
  const [manufacturer,setManufacturer]=useState('')
  const [model,setModel]=useState('')
  const [loading,setLoading]=useState(false)
  const [checked,setChecked]=useState(false)
  const [result,setResult]=useState<Compatibility | null>(null)

  async function check(e: FormEvent){
    e.preventDefault()
    if(!manufacturer.trim() || !model.trim()) return
    setLoading(true)
    setChecked(false)
    setResult(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('device_compatibility')
      .select('manufacturer,device_family,device_model,region_variant,compatibility_status,installation_note,evidence_note')
      .ilike('manufacturer', manufacturer.trim())
      .ilike('device_model', model.trim())
      .maybeSingle()
    setResult((data as Compatibility | null) ?? null)
    setChecked(true)
    setLoading(false)
  }

  return <main className="page-wrap"><div className="shell">
    <Link className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></Link>
    <section className="page-head"><span className="kicker">DEVICE COMPATIBILITY</span><h1>Check your phone.</h1><p>Compatibility results are published only after RADVORA has reviewed the device/product combination. Unreviewed models are shown as unknown rather than assumed compatible.</p></section>
    <div className="verify-grid">
      <form className="panel" onSubmit={check}>
        <span className="kicker">SHIELDTAG PRO</span><h2>Find your device</h2>
        <input className="field" value={manufacturer} onChange={e=>setManufacturer(e.target.value)} placeholder="Manufacturer, e.g. Apple" />
        <input className="field" value={model} onChange={e=>setModel(e.target.value)} placeholder="Model, e.g. iPhone 16" />
        <div className="actions"><button className="pill light" type="submit" disabled={loading || !manufacturer.trim() || !model.trim()}>{loading?'Checking…':'Check compatibility →'}</button></div>
      </form>
      <aside className="panel status-card">
        <span className="status-pill">{!checked?'AWAITING DEVICE':result?result.compatibility_status.replace('_',' ').toUpperCase():'NOT YET REVIEWED'}</span>
        <h2 style={{fontSize:34,margin:'18px 0 8px'}}>{!checked?'Compatibility status':result?`${result.manufacturer} ${result.device_model}`:'No published result yet.'}</h2>
        {!checked && <p style={{color:'#8492a6',lineHeight:1.7}}>Enter the manufacturer and exact model name.</p>}
        {checked && !result && <p style={{color:'#8492a6',lineHeight:1.7}}>RADVORA has not published a reviewed compatibility record for this exact device yet. This does not mean compatible or incompatible.</p>}
        {result && <div className="verify-result"><div><span>Status</span><b>{result.compatibility_status}</b></div><div><span>Family</span><b>{result.device_family || '—'}</b></div><div><span>Variant</span><b>{result.region_variant || 'General'}</b></div><div><span>Installation</span><b>{result.installation_note || 'Standard guidance applies'}</b></div></div>}
      </aside>
    </div>
  </div></main>
}
