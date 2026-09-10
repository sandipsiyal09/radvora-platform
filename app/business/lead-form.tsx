'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function BusinessLeadForm(){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('')
    const form=new FormData(e.currentTarget)
    const supabase=createClient()
    const {error}=await supabase.rpc('submit_business_lead',{
      p_name:String(form.get('name')||''),
      p_email:String(form.get('email')||''),
      p_phone:String(form.get('phone')||''),
      p_company:String(form.get('company')||''),
      p_source:'business-page',
      p_notes:String(form.get('notes')||'')
    })
    if(error){setMessage(error.message)}else{setMessage('Thank you. Your business enquiry has been received.');e.currentTarget.reset()}
    setBusy(false)
  }

  return <form className="panel" onSubmit={submit} style={{display:'grid',gap:12}}>
    <span className="kicker">BUSINESS ENQUIRY</span>
    <h2>Corporate, retail, distributor & OEM</h2>
    <input className="field" name="name" required minLength={2} placeholder="Full name"/>
    <input className="field" name="company" placeholder="Company"/>
    <input className="field" name="email" type="email" required placeholder="Work email"/>
    <input className="field" name="phone" placeholder="Phone"/>
    <textarea className="field" name="notes" rows={5} placeholder="Tell us about quantities, channels, use case or partnership interest"/>
    <button className="pill light" disabled={busy}>{busy?'Submitting…':'Submit enquiry →'}</button>
    {message?<p className="status-message">{message}</p>:null}
  </form>
}
