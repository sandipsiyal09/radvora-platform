'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type SerialOption={id:string;serial_number:string;product_name:string}

export default function CustomerCare({serials}:{serials:SerialOption[]}){
  const [supportMessage,setSupportMessage]=useState('')
  const [warrantyMessage,setWarrantyMessage]=useState('')
  const [busy,setBusy]=useState<'support'|'warranty'|null>(null)

  async function createSupport(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy('support');setSupportMessage('')
    const form=new FormData(e.currentTarget)
    const supabase=createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSupportMessage('Please sign in again.');setBusy(null);return}
    const {error}=await supabase.from('support_tickets').insert({
      user_id:user.id,
      serial_id:(form.get('serial_id') as string)||null,
      subject:String(form.get('subject')||'').trim(),
      message:String(form.get('message')||'').trim(),
      priority:'normal'
    })
    setSupportMessage(error?error.message:'Support ticket submitted successfully.')
    if(!error)e.currentTarget.reset()
    setBusy(null)
  }

  async function createWarranty(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy('warranty');setWarrantyMessage('')
    const form=new FormData(e.currentTarget)
    const supabase=createClient()
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setWarrantyMessage('Please sign in again.');setBusy(null);return}
    const serialId=String(form.get('serial_id')||'')
    if(!serialId){setWarrantyMessage('Select a registered product first.');setBusy(null);return}
    const {error}=await supabase.from('warranty_claims').insert({
      user_id:user.id,
      serial_id:serialId,
      issue_type:String(form.get('issue_type')||'product_issue'),
      description:String(form.get('description')||'').trim()
    })
    setWarrantyMessage(error?error.message:'Warranty request submitted successfully.')
    if(!error)e.currentTarget.reset()
    setBusy(null)
  }

  return <div className="care-grid">
    <form className="panel" onSubmit={createSupport}>
      <span className="kicker">SUPPORT</span><h2>Contact product care</h2>
      <select className="field" name="serial_id" defaultValue=""><option value="">General support</option>{serials.map(s=><option key={s.id} value={s.id}>{s.product_name} · {s.serial_number}</option>)}</select>
      <input className="field" name="subject" minLength={3} maxLength={160} required placeholder="Subject" />
      <textarea className="field textarea" name="message" minLength={10} maxLength={5000} required placeholder="How can we help?" />
      <button className="pill light" disabled={busy==='support'}>{busy==='support'?'Submitting…':'Submit ticket →'}</button>
      {supportMessage?<p className="status-message">{supportMessage}</p>:null}
    </form>
    <form className="panel" onSubmit={createWarranty}>
      <span className="kicker">WARRANTY</span><h2>Start a warranty request</h2>
      <select className="field" name="serial_id" required defaultValue=""><option value="" disabled>Select registered product</option>{serials.map(s=><option key={s.id} value={s.id}>{s.product_name} · {s.serial_number}</option>)}</select>
      <select className="field" name="issue_type" defaultValue="product_issue"><option value="product_issue">Product issue</option><option value="adhesive_issue">Adhesive / installation</option><option value="physical_damage">Physical damage review</option><option value="other">Other</option></select>
      <textarea className="field textarea" name="description" minLength={10} maxLength={5000} required placeholder="Describe the issue and what happened." />
      <button className="pill light" disabled={busy==='warranty'||serials.length===0}>{busy==='warranty'?'Submitting…':'Submit warranty request →'}</button>
      {serials.length===0?<p className="empty-state">Register a product before opening a warranty request.</p>:null}
      {warrantyMessage?<p className="status-message">{warrantyMessage}</p>:null}
    </form>
  </div>
}
