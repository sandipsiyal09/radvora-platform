'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function RegisterProduct(){
  const [serial,setSerial]=useState('')
  const [token,setToken]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)

  async function submit(e:FormEvent){
    e.preventDefault()
    const value=serial.trim().toUpperCase()
    const authToken=token.trim()
    if(!value||authToken.length<16) return
    setLoading(true);setMessage('')
    const supabase=createClient()
    const { error }=await supabase.rpc('register_product_serial',{p_serial:value,p_qr_token:authToken})
    setMessage(error?error.message:'Product registered successfully. Refresh this page to see it in your account.')
    if(!error) setToken('')
    setLoading(false)
  }

  return <form className="register-box" onSubmit={submit}>
    <span className="kicker">REGISTER PRODUCT</span>
    <h2>Activate your RADVORA product</h2>
    <p className="empty-state">Enter the printed serial and the private authentication token encoded in the product QR. Registration fails if either value does not match the production registry.</p>
    <input className="field" value={serial} onChange={e=>setSerial(e.target.value)} placeholder="Serial: RV-SP-XXXX-XXXX" autoComplete="off" />
    <input className="field" value={token} onChange={e=>setToken(e.target.value)} placeholder="Private QR authentication token" autoComplete="off" type="password" />
    <div className="actions"><button className="pill light" disabled={loading||!serial.trim()||token.trim().length<16}>{loading?'Registering…':'Register product →'}</button></div>
    {message?<p className="status-message">{message}</p>:null}
  </form>
}
