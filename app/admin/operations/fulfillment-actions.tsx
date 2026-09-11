'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props={id:string;status:string;carrier?:string|null;trackingNumber?:string|null;trackingUrl?:string|null}
type ApiResponse={error?:string}

const nextStatus:Record<string,string|undefined>={paid:'processing',processing:'shipped',shipped:'delivered'}
const label=(value:string)=>value.replaceAll('_',' ')

export default function FulfillmentActions({id,status,carrier:initialCarrier,trackingNumber:initialTracking,trackingUrl:initialUrl}:Props){
  const router=useRouter();const next=nextStatus[status]
  const [carrier,setCarrier]=useState(initialCarrier||'');const [trackingNumber,setTrackingNumber]=useState(initialTracking||'');const [trackingUrl,setTrackingUrl]=useState(initialUrl||'')
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('')
  if(!next)return null
  const shippingRequired=next==='shipped'

  async function submit(){
    setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/admin/operations/transition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'fulfillment',id,status:next,carrier:shippingRequired?carrier:null,trackingNumber:shippingRequired?trackingNumber:null,trackingUrl:shippingRequired&&trackingUrl?trackingUrl:null})})
      let payload:ApiResponse={};try{payload=await response.json() as ApiResponse}catch{}
      if(!response.ok)throw new Error(payload.error||'Unable to update fulfillment.')
      setMessage('Updated');router.refresh()
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to update fulfillment.')}
    finally{setBusy(false)}
  }

  return <div style={{display:'grid',gap:8,marginTop:10}}>
    {shippingRequired?<>
      <input className="field" value={carrier} maxLength={120} onChange={e=>setCarrier(e.target.value)} placeholder="Carrier (required)" disabled={busy}/>
      <input className="field" value={trackingNumber} maxLength={160} onChange={e=>setTrackingNumber(e.target.value)} placeholder="Tracking number (required)" disabled={busy}/>
      <input className="field" type="url" value={trackingUrl} maxLength={500} onChange={e=>setTrackingUrl(e.target.value)} placeholder="HTTPS tracking URL (optional)" disabled={busy}/>
    </>:null}
    <button className="pill light" type="button" disabled={busy||shippingRequired&&(!carrier.trim()||!trackingNumber.trim())} onClick={submit}>{busy?'Updating…':`Mark ${label(next)} →`}</button>
    {message?<span className="status-message" role="status">{message}</span>:null}
  </div>
}
