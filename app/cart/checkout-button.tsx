'use client'

import { useState } from 'react'

export default function CheckoutButton({disabled=false}:{disabled?:boolean}){
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')

  async function checkout(){
    setLoading(true);setMessage('')
    try{
      const response=await fetch('/api/checkout/stripe',{method:'POST'})
      const payload=await response.json()
      if(!response.ok||!payload?.url){
        setMessage(payload?.error||'Unable to start secure checkout.')
        return
      }
      window.location.assign(payload.url)
    }catch{
      setMessage('Unable to start secure checkout. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  return <div><button className="pill light" type="button" onClick={checkout} disabled={disabled||loading}>{loading?'Opening secure checkout…':'Pay securely →'}</button>{message?<p className="status-message">{message}</p>:null}</div>
}
