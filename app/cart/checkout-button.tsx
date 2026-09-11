'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

type StartPayload={paymentUrl?:string;providerSessionId?:string;expiresAt?:string|null;orderId?:string;orderNumber?:string;error?:string}

export default function CheckoutButton({disabled=false,gatewayReady=false}:{disabled?:boolean;gatewayReady?:boolean}){
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [acceptedPolicies,setAcceptedPolicies]=useState(false)
  const [form,setForm]=useState({name:'',phone:'',line1:'',line2:'',city:'',state:'',postalCode:''})

  function setField(key:keyof typeof form,value:string){setForm(current=>({...current,[key]:value}))}

  async function checkout(event:FormEvent){
    event.preventDefault()
    if(disabled||!gatewayReady||loading)return
    if(!acceptedPolicies){setMessage('Please accept the checkout policies before payment.');return}
    setLoading(true);setMessage('Preparing a time-limited secure payment session…')
    try{
      const response=await fetch('/api/checkout/razorpay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,acceptedPolicies:true})})
      const start=await response.json() as StartPayload
      if(!response.ok||!start.paymentUrl){setMessage(start.error||'India checkout is not available yet.');return}
      let paymentUrl:URL
      try{paymentUrl=new URL(start.paymentUrl)}catch{setMessage('The payment provider returned an invalid checkout URL.');return}
      if(paymentUrl.protocol!=='https:'||!paymentUrl.hostname.endsWith('razorpay.com')&&!paymentUrl.hostname.endsWith('rzp.io')){setMessage('The payment provider returned an untrusted checkout URL.');return}
      setMessage(start.expiresAt?`Opening secure payment. This session expires at ${new Date(start.expiresAt).toLocaleTimeString('en-IN')}.`:'Opening secure payment…')
      window.location.assign(paymentUrl.toString())
    }catch(error){console.error('checkout_start_failed',error);setMessage('Unable to start secure India checkout. Please try again.')}
    finally{setLoading(false)}
  }

  const locked=disabled||!gatewayReady
  return <form onSubmit={checkout} style={{display:'grid',gap:10,marginTop:16}} aria-label="India delivery and payment">
    <span className="kicker">DELIVERY IN INDIA</span>
    <input className="field" required maxLength={120} aria-label="Full name" autoComplete="name" placeholder="Full name" value={form.name} onChange={e=>setField('name',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" required inputMode="tel" maxLength={20} aria-label="Indian mobile number" autoComplete="tel" placeholder="Indian mobile number" value={form.phone} onChange={e=>setField('phone',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" required maxLength={180} aria-label="Address line 1" autoComplete="address-line1" placeholder="Address line 1" value={form.line1} onChange={e=>setField('line1',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" maxLength={180} aria-label="Address line 2" autoComplete="address-line2" placeholder="Address line 2 (optional)" value={form.line2} onChange={e=>setField('line2',e.target.value)} disabled={!gatewayReady}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input className="field" required maxLength={100} aria-label="City" autoComplete="address-level2" placeholder="City" value={form.city} onChange={e=>setField('city',e.target.value)} disabled={!gatewayReady}/><input className="field" required maxLength={100} aria-label="State or Union Territory" autoComplete="address-level1" placeholder="State / UT" value={form.state} onChange={e=>setField('state',e.target.value)} disabled={!gatewayReady}/></div>
    <input className="field" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} aria-label="6-digit PIN code" autoComplete="postal-code" placeholder="6-digit PIN code" value={form.postalCode} onChange={e=>setField('postalCode',e.target.value.replace(/\D/g,'').slice(0,6))} disabled={!gatewayReady}/>
    <label className="checkout-consent"><input type="checkbox" checked={acceptedPolicies} onChange={e=>setAcceptedPolicies(e.target.checked)} disabled={!gatewayReady}/><span>I agree to the <Link href="/terms" target="_blank">Terms</Link>, <Link href="/returns" target="_blank">Returns &amp; Refunds</Link>, <Link href="/shipping" target="_blank">Shipping Policy</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
    <button className="pill light" type="submit" disabled={locked||loading||!acceptedPolicies}>{!gatewayReady?'India payments activation pending':loading?'Preparing secure checkout…':'Pay securely in INR →'}</button>
    <p className="status-message">{gatewayReady?'A short-lived Razorpay-hosted payment session handles UPI, cards, netbanking and other enabled Indian methods. RADVORA marks payment complete only from signed/provider-authoritative server events.':'Online payment collection stays disabled until the production Indian merchant keys and webhook secret are configured.'}</p>
    {message?<p className="status-message" role="status" aria-live="polite">{message}</p>:null}
  </form>
}
