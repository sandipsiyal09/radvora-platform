'use client'

import { FormEvent, useState } from 'react'
import ui from '../public-brand.module.css'

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

  const idPrefix=`${source.replace(/[^a-z0-9-]/gi,'-')}-request`

  return <form className={ui.formShell} onSubmit={submit} aria-label={isPrivacy?'Privacy request':'Business enquiry'}>
    <span className={ui.kicker}>{isPrivacy?'PRIVACY REQUEST':'BUSINESS ENQUIRY'}</span>
    <h2>{title}</h2>
    <div aria-hidden="true" style={{position:'absolute',left:'-10000px',width:1,height:1,overflow:'hidden'}}>
      <label htmlFor={`website-${source}`}>Website</label>
      <input id={`website-${source}`} name="website" tabIndex={-1} autoComplete="off" />
    </div>
    <label className={ui.formLabel} htmlFor={`${idPrefix}-name`}>Full name</label>
    <input id={`${idPrefix}-name`} className={ui.formField} name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Full name"/>
    {!isPrivacy?<><label className={ui.formLabel} htmlFor={`${idPrefix}-company`}>Company</label><input id={`${idPrefix}-company`} className={ui.formField} name="company" maxLength={160} autoComplete="organization" placeholder="Company"/></>:null}
    <label className={ui.formLabel} htmlFor={`${idPrefix}-email`}>{isPrivacy?'Email address':'Work email'}</label>
    <input id={`${idPrefix}-email`} className={ui.formField} name="email" type="email" required maxLength={320} autoComplete="email" placeholder={isPrivacy?'Email address':'Work email'}/>
    <label className={ui.formLabel} htmlFor={`${idPrefix}-phone`}>Phone (optional)</label>
    <input id={`${idPrefix}-phone`} className={ui.formField} name="phone" maxLength={40} autoComplete="tel" inputMode="tel" placeholder="Phone (optional)"/>
    <label className={ui.formLabel} htmlFor={`${idPrefix}-notes`}>{isPrivacy?'Privacy request details':'Enquiry details'}</label>
    <textarea id={`${idPrefix}-notes`} className={ui.formField} name="notes" rows={5} maxLength={3000} required={isPrivacy} placeholder={isPrivacy?'Describe your privacy question or request. Do not include passwords, card data or authentication secrets.':'Tell us about quantities, channels, use case or partnership interest'}/>
    <button className={ui.primary} type="submit" disabled={busy}>{busy?'Submitting…':isPrivacy?'Submit privacy request →':'Submit enquiry →'}</button>
    {message?<p className={ui.formStatus} role="status" aria-live="polite">{message}</p>:null}
  </form>
}
