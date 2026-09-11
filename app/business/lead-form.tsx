'use client'

import { FormEvent, useState } from 'react'

export default function BusinessLeadForm({source='business-page',title='Corporate, retail, distributor & OEM'}:{source?:string;title?:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const isPrivacy=source==='privacy-page'

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('')
    const form=new FormData(e.currentTarget)

    try {
      const response=await fetch('/api/business-leads',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          name:String(form.get('name')||''),
          email:String(form.get('email')||''),
          phone:String(form.get('phone')||''),
          company:String(form.get('company')||''),
          source,
          notes:String(form.get('notes')||''),
          website:String(form.get('website')||'')
        })
      })
      const payload=await response.json().catch(()=>({})) as {error?:string}
      if(!response.ok){setMessage(payload.error||'We could not submit your request. Please try again shortly.');return}
      setMessage(isPrivacy?'Your privacy request has been received. We may contact you to verify identity before acting on it.':'Thank you. Your business enquiry has been received.')
      e.currentTarget.reset()
    } catch {
      setMessage('We could not submit your request. Please try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  return <form className="panel" onSubmit={submit} style={{display:'grid',gap:12}}>
    <span className="kicker">{isPrivacy?'PRIVACY REQUEST':'BUSINESS ENQUIRY'}</span>
    <h2>{title}</h2>
    <div aria-hidden="true" style={{position:'absolute',left:'-10000px',width:1,height:1,overflow:'hidden'}}>
      <label htmlFor={`website-${source}`}>Website</label>
      <input id={`website-${source}`} name="website" tabIndex={-1} autoComplete="off" />
    </div>
    <input className="field" name="name" required minLength={2} maxLength={120} placeholder="Full name"/>
    {!isPrivacy?<input className="field" name="company" maxLength={160} placeholder="Company"/>:null}
    <input className="field" name="email" type="email" required maxLength={320} placeholder={isPrivacy?'Email address':'Work email'}/>
    <input className="field" name="phone" maxLength={40} placeholder="Phone (optional)"/>
    <textarea className="field" name="notes" rows={5} maxLength={3000} required={isPrivacy} placeholder={isPrivacy?'Describe your privacy question or request. Do not include passwords, card data or authentication secrets.':'Tell us about quantities, channels, use case or partnership interest'}/>
    <button className="pill light" disabled={busy}>{busy?'Submitting…':isPrivacy?'Submit privacy request →':'Submit enquiry →'}</button>
    {message?<p className="status-message" aria-live="polite">{message}</p>:null}
  </form>
}
