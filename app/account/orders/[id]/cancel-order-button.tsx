'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelOrderButton({orderId}:{orderId:string}){
  const router=useRouter()
  const [confirming,setConfirming]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function cancelOrder(){
    if(busy) return
    setBusy(true);setMessage('')
    try{
      const response=await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`,{method:'POST'})
      const payload=await response.json()
      if(!response.ok){setMessage(payload?.error||'Unable to cancel this order.');return}
      setMessage('Order cancelled. No payment was captured by this cancellation workflow.')
      setConfirming(false)
      router.refresh()
    }catch{setMessage('Unable to cancel this order safely. Please refresh before trying again.')}
    finally{setBusy(false)}
  }

  return <div style={{marginTop:10}}>
    {!confirming?<button className="pill ghost" type="button" disabled={busy} onClick={()=>setConfirming(true)}>Cancel unpaid order</button>:<div className="panel" style={{padding:12}}><strong>Cancel this unpaid order?</strong><p className="empty-state">Cancellation is allowed only while the order is still pending and no payment has been captured.</p><div className="actions"><button className="pill light" type="button" disabled={busy} onClick={cancelOrder}>{busy?'Cancelling…':'Confirm cancellation'}</button><button className="pill ghost" type="button" disabled={busy} onClick={()=>setConfirming(false)}>Keep order</button></div></div>}
    {message?<p className="status-message" role="status">{message}</p>:null}
  </div>
}
