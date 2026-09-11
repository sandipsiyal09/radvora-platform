'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefundOrderButton({orderId,gatewayReady}:{orderId:string;gatewayReady:boolean}){
  const router=useRouter()
  const [open,setOpen]=useState(false)
  const [reason,setReason]=useState('')
  const [confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function submit(event:FormEvent){
    event.preventDefault()
    if(!gatewayReady||!confirmed||reason.trim().length<5||busy) return
    setBusy(true);setMessage('')
    try{
      const response=await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/refund`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:reason.trim()})
      })
      const payload=await response.json()
      if(!response.ok){setMessage(payload?.error||'Unable to request the refund safely.');return}
      setMessage(payload.status==='processed'?'Full refund processed.':'Full refund accepted and awaiting provider confirmation.')
      setOpen(false)
      router.refresh()
    }catch{setMessage('Unable to request the refund safely. Please check payment state before retrying.')}
    finally{setBusy(false)}
  }

  if(!gatewayReady)return <p className="empty-state">Refund controls remain disabled until the production India payment gateway is configured.</p>

  return <div style={{marginTop:12}}>
    {!open?<button className="pill ghost" type="button" onClick={()=>setOpen(true)}>Review full refund</button>:<form onSubmit={submit} style={{display:'grid',gap:8}}>
      <strong>Full refund confirmation</strong>
      <textarea className="field" minLength={5} maxLength={500} required value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for refund"/>
      <label className="checkout-consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I confirm this is a full refund of a captured payment and understand the provider refund cannot be cancelled from this workflow after submission.</span></label>
      <div className="actions"><button className="pill light" disabled={busy||!confirmed||reason.trim().length<5}>{busy?'Submitting…':'Submit full refund'}</button><button className="pill ghost" type="button" disabled={busy} onClick={()=>{setOpen(false);setConfirmed(false)}}>Cancel</button></div>
    </form>}
    {message?<p className="status-message" role="status">{message}</p>:null}
  </div>
}
