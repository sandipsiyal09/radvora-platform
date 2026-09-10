'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

type Result = {
  serial_number: string
  batch_code: string | null
  manufactured_at: string | null
  status: 'active' | 'activated' | 'revoked' | 'returned'
  product_name: string
  product_slug: string
  sku: string
}

export default function VerifyPage(){
  const [serial,setSerial]=useState('')
  const [loading,setLoading]=useState(false)
  const [result,setResult]=useState<Result | null>(null)
  const [checked,setChecked]=useState(false)
  const [message,setMessage]=useState('')

  async function verify(e: FormEvent){
    e.preventDefault()
    const normalized = serial.trim().toUpperCase()
    if(!normalized) return
    setLoading(true)
    setChecked(false)
    setResult(null)
    setMessage('')

    try {
      const response = await fetch('/api/product-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: normalized }),
      })
      const payload = await response.json() as { result?: Result | null; error?: string }

      if (!response.ok) {
        setMessage(payload.error || 'Verification is temporarily unavailable.')
        return
      }

      setResult(payload.result ?? null)
      setChecked(true)
    } catch {
      setMessage('Verification is temporarily unavailable. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = !checked ? 'AWAITING SERIAL' : result ? (result.status === 'revoked' ? 'SERIAL REVOKED' : 'SERIAL FOUND') : 'NOT FOUND'
  const statusTitle = !checked ? 'Authenticity status' : result ? (result.status === 'revoked' ? 'Do not rely on this unit.' : 'RADVORA record located.') : 'No matching production record.'

  return <main className="page-wrap">
    <div className="shell">
      <Link className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></Link>
      <div className="page-head">
        <span className="kicker">PRODUCT AUTHENTICATION</span>
        <h1>Verify your ShieldTag.</h1>
        <p>Check a RADVORA production serial against the live authenticity registry. Public results intentionally exclude internal QR hashes, customer identity and unpublished test data.</p>
      </div>
      <div className="verify-grid">
        <form className="panel" onSubmit={verify}>
          <span className="kicker">SERIAL / QR</span>
          <h2>Enter product serial</h2>
          <input className="field" value={serial} onChange={e=>{setSerial(e.target.value);setChecked(false);setResult(null);setMessage('')}} placeholder="Example: RV-SP-XXXX-XXXX" autoComplete="off" maxLength={64} />
          <div className="actions"><button className="pill light" type="submit" disabled={!serial.trim() || loading}>{loading?'Checking…':'Check product →'}</button></div>
          {message ? <p className="status-message" role="status">{message}</p> : null}
          <p style={{color:'#7f8ca1',lineHeight:1.7,fontSize:13}}>A valid result confirms that the serial exists in RADVORA’s production registry. It does not by itself establish any scientific or health claim.</p>
        </form>
        <aside className="panel status-card" aria-live="polite">
          <span className="status-pill">{statusLabel}</span>
          <h2 style={{fontSize:34,margin:'18px 0 8px'}}>{statusTitle}</h2>
          {!checked && <p style={{color:'#8492a6',lineHeight:1.7}}>Enter a RADVORA serial to begin verification.</p>}
          {checked && !result && <p style={{color:'#8492a6',lineHeight:1.7}}>This serial is not present in the current public authenticity registry. Re-check the characters or contact RADVORA support.</p>}
          {result && <div className="verify-result">
            <div><span>Product</span><b>{result.product_name}</b></div>
            <div><span>SKU</span><b>{result.sku}</b></div>
            <div><span>Serial</span><b>{result.serial_number}</b></div>
            <div><span>Status</span><b>{result.status}</b></div>
            <div><span>Batch</span><b>{result.batch_code || 'Not published'}</b></div>
            <div><span>Manufactured</span><b>{result.manufactured_at || 'Not published'}</b></div>
          </div>}
        </aside>
      </div>
    </div>
  </main>
}
