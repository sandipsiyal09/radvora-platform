'use client'

import { FormEvent, useState } from 'react'

declare global {
  interface Window {
    Razorpay?: new (options:Record<string,unknown>)=>{open:()=>void;on:(event:string,handler:(response:unknown)=>void)=>void}
  }
}

type StartPayload={
  keyId:string
  providerOrderId:string
  amountPaise:number
  currency:'INR'
  orderId:string
  orderNumber:string
  customer:{name:string;email:string;phone:string}
  error?:string
}

type RazorpaySuccess={razorpay_payment_id:string;razorpay_order_id:string;razorpay_signature:string}

function loadRazorpay(){
  return new Promise<boolean>((resolve)=>{
    if(window.Razorpay) return resolve(true)
    const existing=document.querySelector<HTMLScriptElement>('script[data-radvora-razorpay]')
    if(existing){
      existing.addEventListener('load',()=>resolve(Boolean(window.Razorpay)),{once:true})
      existing.addEventListener('error',()=>resolve(false),{once:true})
      return
    }
    const script=document.createElement('script')
    script.src='https://checkout.razorpay.com/v1/checkout.js'
    script.async=true
    script.dataset.radvoraRazorpay='true'
    script.onload=()=>resolve(Boolean(window.Razorpay))
    script.onerror=()=>resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutButton({disabled=false,gatewayReady=false}:{disabled?:boolean;gatewayReady?:boolean}){
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [form,setForm]=useState({name:'',phone:'',line1:'',line2:'',city:'',state:'',postalCode:''})

  function setField(key:keyof typeof form,value:string){setForm(current=>({...current,[key]:value}))}

  async function checkout(event:FormEvent){
    event.preventDefault()
    if(disabled||!gatewayReady||loading) return
    setLoading(true);setMessage('')
    try{
      const sdkReady=await loadRazorpay()
      if(!sdkReady||!window.Razorpay){setMessage('Secure India checkout could not load. Please try again.');return}
      const startResponse=await fetch('/api/checkout/razorpay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      const start=await startResponse.json() as StartPayload
      if(!startResponse.ok||!start.providerOrderId){setMessage(start.error||'India checkout is not available yet.');return}
      const razorpay=new window.Razorpay({
        key:start.keyId,amount:start.amountPaise,currency:'INR',name:'RADVORA Technologies',description:`Order ${start.orderNumber}`,
        order_id:start.providerOrderId,prefill:{name:start.customer.name,email:start.customer.email,contact:start.customer.phone},notes:{radvora_order_id:start.orderId},theme:{color:'#0b1220'},
        handler:async(response:RazorpaySuccess)=>{
          setMessage('Confirming payment securely…')
          try{
            await fetch('/api/checkout/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:start.orderId,razorpayOrderId:response.razorpay_order_id,razorpayPaymentId:response.razorpay_payment_id,razorpaySignature:response.razorpay_signature})})
          }finally{window.location.assign(`/checkout/success?order_id=${encodeURIComponent(start.orderId)}`)}
        },
        modal:{ondismiss:()=>setMessage('Payment window closed. Your order is not marked paid unless server verification confirms a captured payment.')}
      })
      razorpay.on('payment.failed',()=>setMessage('Payment was not completed. You can retry securely from your order.'))
      razorpay.open()
    }catch{setMessage('Unable to start secure India checkout. Please try again.')}
    finally{setLoading(false)}
  }

  const locked=disabled||!gatewayReady
  return <form onSubmit={checkout} style={{display:'grid',gap:10,marginTop:16}}>
    <span className="kicker">DELIVERY IN INDIA</span>
    <input className="field" required maxLength={120} placeholder="Full name" value={form.name} onChange={e=>setField('name',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" required inputMode="tel" maxLength={20} placeholder="Indian mobile number" value={form.phone} onChange={e=>setField('phone',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" required maxLength={180} placeholder="Address line 1" value={form.line1} onChange={e=>setField('line1',e.target.value)} disabled={!gatewayReady}/>
    <input className="field" maxLength={180} placeholder="Address line 2 (optional)" value={form.line2} onChange={e=>setField('line2',e.target.value)} disabled={!gatewayReady}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input className="field" required maxLength={100} placeholder="City" value={form.city} onChange={e=>setField('city',e.target.value)} disabled={!gatewayReady}/><input className="field" required maxLength={100} placeholder="State / UT" value={form.state} onChange={e=>setField('state',e.target.value)} disabled={!gatewayReady}/></div>
    <input className="field" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} placeholder="6-digit PIN code" value={form.postalCode} onChange={e=>setField('postalCode',e.target.value.replace(/\D/g,'').slice(0,6))} disabled={!gatewayReady}/>
    <button className="pill light" type="submit" disabled={locked||loading}>{!gatewayReady?'India payments activation pending':loading?'Preparing secure checkout…':'Pay securely in INR →'}</button>
    <p className="status-message">{gatewayReady?'UPI, Indian cards, netbanking and supported wallets are handled by the configured Indian payment gateway. RADVORA marks an order paid only after server verification.':'Online payment collection stays disabled until the production Indian merchant keys and webhook secret are configured.'}</p>
    {message?<p className="status-message" role="status">{message}</p>:null}
  </form>
}
