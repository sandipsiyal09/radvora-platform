'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Result={error?:string;status?:string;detail?:string;expiresAt?:string|null}

export default function PaymentReconcileButton({attemptId}:{attemptId:string}){
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function reconcile(){
    if(!window.confirm('Reconcile this payment session directly with Razorpay? This cannot manually mark payment paid; it only applies provider-proven state.'))return
    setBusy(true);setMessage('')
    try{
      const response=await fetch(`/api/admin/payments/${encodeURIComponent(attemptId)}/reconcile`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
      const result=await response.json() as Result
      if(!response.ok){setMessage(result.error||'Unable to reconcile payment session.');return}
      setMessage(result.detail||`Provider state: ${result.status||'reconciled'}.`)
      router.refresh()
    }catch(error){console.error('payment_reconcile_request_failed',error);setMessage('Unable to reconcile payment session.')}
    finally{setBusy(false)}
  }

  return <div style={{marginTop:8}}><button className="pill ghost" type="button" disabled={busy} onClick={reconcile}>{busy?'Reconciling…':'Reconcile with Razorpay →'}</button>{message?<p className="status-message" role="status">{message}</p>:null}</div>
}
