'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function RegisterProduct(){
  const [serial,setSerial]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)

  async function submit(e:FormEvent){
    e.preventDefault()
    const value=serial.trim().toUpperCase()
    if(!value) return
    setLoading(true);setMessage('')
    const supabase=createClient()
    const { error }=await supabase.rpc('register_product_serial',{p_serial:value})
    setMessage(error?error.message:'Product registered successfully. Refresh this page to see it in your account.')
    setLoading(false)
  }

  return <form className="register-box" onSubmit={submit}>
    <span className="kicker">REGISTER PRODUCT</span>
    <h2>Activate your RADVORA serial</h2>
    <p className="empty-state">Registration requires a valid production serial and a signed-in account. Revoked, returned, or already-owned serials are rejected by the database.</p>
    <input className="field" value={serial} onChange={e=>setSerial(e.target.value)} placeholder="RV-SP-XXXX-XXXX" autoComplete="off" />
    <div className="actions"><button className="pill light" disabled={loading||!serial.trim()}>{loading?'Registering…':'Register product →'}</button></div>
    {message?<p className="status-message">{message}</p>:null}
  </form>
}
