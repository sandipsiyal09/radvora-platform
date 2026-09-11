'use client'

import { useState } from 'react'

declare global {
  interface Window {
    Razorpay?: new (options:Record<string,unknown>)=>{open:()=>void;on:(event:string,handler:(response:unknown)=>void)=>void}
  }
}

type StartPayload={keyId:string;providerOrderId:string;amountPaise:number;currency:'INR';orderId:string;orderNumber:string;customer:{name:string;email:string;phone:string};error?:string}
type RazorpaySuccess={razorpay_payment_id:string;razorpay_order_id:string;razorpay_signature:string}

function loadRazorpay(){
  return new Promise<boolean>((resolve)=>{
    if(window.Razorpay) return resolve(true)
    const existing=document.querySelector<HTMLScriptElement>('script[data-radvora-razorpay]')
    if(existing){existing.addEventListener('load',()=>resolve(Boolean(window.Razorpay)),{once:true});existing.addEventListener('error',()=>resolve(false),{once:true});return}
    const script=document.createElement('script')
    script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.dataset.radvoraRazorpay='true'
    script.onload=()=>resolve(Boolean(window.Razorpay));script.onerror=()=>resolve(false);document.body.appendChild(script)
  })
}

export default function RetryPaymentButton({orderId}:{orderId:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function retry(){
    setBusy(true);setMessage('')
    try{
      const sdkReady=await loadRazorpay()
      if(!sdkReady||!window.Razorpay){setMessage('Secure India checkout could not load. Please try again.');return}
      const response=await fetch('/api/checkout/razorpay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})})
      const start=await response.json() as StartPayload
      if(!response.ok||!start.providerOrderId){setMessage(start.error||'Unable to restart India checkout.');return}

      const razorpay=new window.Razorpay({
        key:start.keyId,amount:start.amountPaise,currency:'INR',name:'RADVORA Technologies',description:`Order ${start.orderNumber}`,
        order_id:start.providerOrderId,prefill:{name:start.customer.name,email:start.customer.email,contact:start.customer.phone},notes:{radvora_order_id:start.orderId},theme:{color:'#0b1220'},
        handler:async(payment:RazorpaySuccess)=>{
          setMessage('Confirming payment securely…')
          try{
            await fetch('/api/checkout/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:start.orderId,razorpayOrderId:payment.razorpay_order_id,razorpayPaymentId:payment.razorpay_payment_id,razorpaySignature:payment.razorpay_signature})})
          }finally{
            window.location.assign(`/checkout/success?order_id=${encodeURIComponent(start.orderId)}`)
          }
        },
        modal:{ondismiss:()=>setMessage('Payment window closed. The order remains unpaid unless server verification confirms a captured payment.')}
      })
      razorpay.on('payment.failed',()=>setMessage('Payment was not completed. You can retry securely.'))
      razorpay.open()
    }catch{
      setMessage('Unable to restart payment. Please try again.')
    }finally{
      setBusy(false)
    }
  }

  return <div><button className="pill light" type="button" disabled={busy} onClick={retry}>{busy?'Preparing India checkout…':'Retry secure payment →'}</button>{message?<p className="status-message" role="status">{message}</p>:null}</div>
}
