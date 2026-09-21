'use client'

import { FormEvent, useState } from 'react'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'

type Result={
  serial_number:string
  batch_code:string|null
  manufactured_at:string|null
  status:'active'|'activated'|'revoked'|'returned'
  product_name:string
  product_slug:string
  sku:string
}

export default function VerifyPage(){
  const [serial,setSerial]=useState('')
  const [loading,setLoading]=useState(false)
  const [result,setResult]=useState<Result|null>(null)
  const [checked,setChecked]=useState(false)
  const [message,setMessage]=useState('')

  async function verify(e:FormEvent){
    e.preventDefault()
    const normalized=serial.trim().toUpperCase()
    if(!normalized)return
    setLoading(true);setChecked(false);setResult(null);setMessage('')
    try{
      const response=await fetch('/api/product-verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serial:normalized})})
      const payload=await response.json() as {result?:Result|null;error?:string}
      if(!response.ok){setMessage(payload.error||'Verification is temporarily unavailable.');return}
      setResult(payload.result??null);setChecked(true)
    }catch{setMessage('Verification is temporarily unavailable. Please try again shortly.')}
    finally{setLoading(false)}
  }

  const statusLabel=!checked?'AWAITING SERIAL':result?(result.status==='revoked'?'SERIAL REVOKED':'SERIAL FOUND'):'NOT FOUND'
  const statusTitle=!checked?'Authenticity status':result?(result.status==='revoked'?'Do not rely on this unit.':'RADVORA record located.'):'No matching production record.'

  return <PublicShell><main className={ui.main} data-cinematic-page="verify">
    <section className={ui.hero}><div className={ui.heroCopy}><span className={ui.kicker}>PRODUCT AUTHENTICATION</span><h1>Verify your<br/><em>RADVORA product.</em></h1><p>Check a supported production serial against the live authenticity registry. Public verification deliberately excludes private QR hashes, customer identity and unpublished internal data.</p></div><aside className={ui.heroAside}><span>WHAT VERIFICATION MEANS</span><strong>Record found ≠ performance claim.</strong><p>A valid serial confirms that a product record exists in RADVORA’s registry. It does not by itself establish compatibility, durability or scientific performance.</p></aside></section>
    <section className={ui.section}><div className={ui.grid2}>
      <form className={[ui.compatPanel,ui.compatForm].join(' ')} onSubmit={verify}><span className={ui.kicker}>SERIAL / QR</span><label className={ui.label}>PRODUCT SERIAL<input className={ui.input} value={serial} onChange={e=>{setSerial(e.target.value);setChecked(false);setResult(null);setMessage('')}} placeholder="Example: RV-SP-XXXX-XXXX" autoComplete="off" maxLength={64}/></label><div className={ui.actions}><button className={ui.primary} type="submit" disabled={!serial.trim()||loading}>{loading?'Checking…':'Check product →'}</button></div>{message&&<div className={ui.notice} role="status">{message}</div>}</form>
      <aside className={ui.compatPanel} aria-live="polite"><span className={ui.status}>{statusLabel}</span><h3>{statusTitle}</h3>{!checked&&<p>Enter a RADVORA serial to begin verification.</p>}{checked&&!result&&<p>This serial is not present in the current public authenticity registry. Re-check the characters or contact RADVORA Support.</p>}{result&&<div className={ui.resultGrid}><div><span>PRODUCT</span><b>{result.product_name}</b></div><div><span>SKU</span><b>{result.sku}</b></div><div><span>SERIAL</span><b>{result.serial_number}</b></div><div><span>STATUS</span><b>{result.status}</b></div><div><span>BATCH</span><b>{result.batch_code||'Not published'}</b></div><div><span>MANUFACTURED</span><b>{result.manufactured_at||'Not published'}</b></div></div>}</aside>
    </div></section>
  </main></PublicShell>
}
