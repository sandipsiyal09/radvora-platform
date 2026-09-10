'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

type Props={
  id:string
  status:string
  carrier?:string|null
  trackingNumber?:string|null
  trackingUrl?:string|null
}

const nextStatus:Record<string,string|undefined>={paid:'processing',processing:'shipped',shipped:'delivered'}
const label=(value:string)=>value.replaceAll('_',' ')

export default function FulfillmentActions({id,status,carrier:initialCarrier,trackingNumber:initialTracking,trackingUrl:initialUrl}:Props){
  const router=useRouter()
  const next=nextStatus[status]
  const [carrier,setCarrier]=useState(initialCarrier||'')
  const [trackingNumber,setTrackingNumber]=useState(initialTracking||'')
  const [trackingUrl,setTrackingUrl]=useState(initialUrl||'')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  if(!next) return null
  const shippingRequired=next==='shipped'

  async function submit(){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const {error}=await supabase.rpc('transition_order_fulfillment',{
      p_order_id:id,
      p_status:next,
      p_carrier:shippingRequired?carrier:null,
      p_tracking_number:shippingRequired?trackingNumber:null,
      p_tracking_url:shippingRequired&&trackingUrl?trackingUrl:null,
    })
    if(error){setMessage(error.message)}else{setMessage('Updated');router.refresh()}
    setBusy(false)
  }

  return <div style={{display:'grid',gap:8,marginTop:10}}>
    {shippingRequired?<>
      <input className="field" value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="Carrier (required)" disabled={busy}/>
      <input className="field" value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)} placeholder="Tracking number (required)" disabled={busy}/>
      <input className="field" type="url" value={trackingUrl} onChange={e=>setTrackingUrl(e.target.value)} placeholder="HTTPS tracking URL (optional)" disabled={busy}/>
    </>:null}
    <button className="pill light" type="button" disabled={busy||shippingRequired&&(!carrier.trim()||!trackingNumber.trim())} onClick={submit}>{busy?'Updating…':`Mark ${label(next)} →`}</button>
    {message?<span className="status-message">{message}</span>:null}
  </div>
}
