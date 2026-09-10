'use client'

import { useState } from 'react'

export default function RetryPaymentButton({orderId}:{orderId:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function retry(){
    setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/checkout/stripe',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({orderId})
      })
      const payload=await response.json()
      if(!response.ok||!payload?.url){setMessage(payload?.error||'Unable to restart payment.');return}
      window.location.assign(payload.url)
    }catch{
      setMessage('Unable to restart payment. Please try again.')
    }finally{
      setBusy(false)
    }
  }

  return <div><button className="pill light" type="button" disabled={busy} onClick={retry}>{busy?'Opening secure checkout…':'Retry secure payment →'}</button>{message?<p className="status-message">{message}</p>:null}</div>
}
