'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

const SERIAL_PATTERN=/^[A-Z0-9][A-Z0-9-]{4,63}$/

export default function RegisterProduct(){
  const [serial,setSerial]=useState('')
  const [token,setToken]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)

  async function submit(e:FormEvent){
    e.preventDefault()
    const value=serial.trim().toUpperCase()
    const authToken=token.trim()
    if(!SERIAL_PATTERN.test(value)||authToken.length<16||authToken.length>512){setMessage('Please check the serial and authentication token.');return}
    setLoading(true);setMessage('')
    try{
      const supabase=createClient()
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setMessage('Please sign in again.');return}
      const {error}=await supabase.rpc('register_product_serial',{p_serial:value,p_qr_token:authToken})
      if(error){console.error('product_registration_failed',error);setMessage('Unable to register this product. Check the serial and private QR token, then try again.');return}
      setMessage('Product registered successfully. Refresh this page to see it in your account.')
      setToken('')
    }catch(error){
      console.error('product_registration_failed',error)
      setMessage('Unable to register this product. Please try again.')
    }finally{setLoading(false)}
  }

  const normalizedSerial=serial.trim().toUpperCase()
  const ready=SERIAL_PATTERN.test(normalizedSerial)&&token.trim().length>=16&&token.trim().length<=512

  return <form className="register-box" onSubmit={submit}>
    <span className="kicker">REGISTER PRODUCT</span>
    <h2>Activate your RADVORA product</h2>
    <p className="empty-state">Enter the printed serial and the private authentication token encoded in the product QR. Registration succeeds only when both values match the production registry.</p>
    <input className="field" value={serial} onChange={e=>setSerial(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,64))} maxLength={64} placeholder="Serial: RV-SP-XXXX-XXXX" autoComplete="off" />
    <input className="field" value={token} onChange={e=>setToken(e.target.value.slice(0,512))} maxLength={512} placeholder="Private QR authentication token" autoComplete="off" type="password" />
    <div className="actions"><button className="pill light" disabled={loading||!ready}>{loading?'Registering…':'Register product →'}</button></div>
    {message?<p className="status-message" role="status">{message}</p>:null}
  </form>
}
