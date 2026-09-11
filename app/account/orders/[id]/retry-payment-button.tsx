'use client'

import { useState } from 'react'

type StartPayload={paymentUrl?:string;expiresAt?:string|null;error?:string}

export default function RetryPaymentButton({orderId}:{orderId:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function retry(){
    setBusy(true);setMessage('Checking the existing payment session…')
    try{
      const response=await fetch('/api/checkout/razorpay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})})
      const start=await response.json() as StartPayload
      if(!response.ok||!start.paymentUrl){setMessage(start.error||'Unable to restart India checkout.');return}
      let paymentUrl:URL
      try{paymentUrl=new URL(start.paymentUrl)}catch{setMessage('The payment provider returned an invalid checkout URL.');return}
      if(paymentUrl.protocol!=='https:'||!paymentUrl.hostname.endsWith('razorpay.com')&&!paymentUrl.hostname.endsWith('rzp.io')){setMessage('The payment provider returned an untrusted checkout URL.');return}
      setMessage(start.expiresAt?`Opening payment session; expires at ${new Date(start.expiresAt).toLocaleTimeString('en-IN')}.`:'Opening secure payment…')
      window.location.assign(paymentUrl.toString())
    }catch(error){console.error('payment_retry_failed',error);setMessage('Unable to restart payment. Please try again.')}
    finally{setBusy(false)}
  }

  return <div><button className="pill light" type="button" disabled={busy} onClick={retry}>{busy?'Preparing India checkout…':'Retry secure payment →'}</button>{message?<p className="status-message" role="status">{message}</p>:null}</div>
}
