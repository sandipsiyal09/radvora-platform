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
    const formElement=e.currentTarget
    try{
      const form=new FormData(formElement)
      const serialId=String(form.get('serial_id')||'')||null
      const subject=String(form.get('subject')||'').trim()
      const message=String(form.get('message')||'').trim()
      if(subject.length<3||subject.length>160||message.length<10||message.length>5000){setSupportMessage('Please check the subject and message length.');return}
      const supabase=createClient()
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setSupportMessage('Please sign in again.');return}
      const {error}=await supabase.rpc('submit_support_ticket',{p_serial_id:serialId,p_subject:subject,p_message:message})
      if(error){
        console.error('support_ticket_submit_failed',error)
        const detail=String(error.message||'')
        setSupportMessage(detail.includes('limit reached')?'You have submitted several support requests recently. Please wait before sending another.':'Unable to submit the support ticket. Please try again.')
        return
      }
      setSupportMessage('Support ticket submitted successfully.')
      formElement.reset()
    }catch(error){
      console.error('support_ticket_submit_failed',error)
      setSupportMessage('Unable to submit the support ticket. Please try again.')
    }finally{setBusy(null)}
  }

  async function createWarranty(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy('warranty');setWarrantyMessage('')
    const formElement=e.currentTarget
    try{
      const form=new FormData(formElement)
      const supabase=createClient()
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setWarrantyMessage('Please sign in again.');return}
      const serialId=String(form.get('serial_id')||'')
      const issueType=String(form.get('issue_type')||'')
      const description=String(form.get('description')||'').trim()
      const allowedIssueTypes=new Set(['product_issue','adhesive_issue','physical_damage','other'])
      if(!serialId){setWarrantyMessage('Select a registered product first.');return}
      if(!allowedIssueTypes.has(issueType)||description.length<10||description.length>5000){setWarrantyMessage('Please check the warranty request details.');return}
      const {error}=await supabase.rpc('submit_warranty_claim',{p_serial_id:serialId,p_issue_type:issueType,p_description:description})
      if(error){
        console.error('warranty_claim_submit_failed',error)
        const detail=String(error.message||'')
        if(detail.includes('active warranty request')) setWarrantyMessage('An active warranty request already exists for this registered product.')
        else if(detail.includes('limit reached')) setWarrantyMessage('You have submitted several warranty requests recently. Please wait before sending another.')
        else setWarrantyMessage('Unable to submit the warranty request. Please try again.')
        return
      }
      setWarrantyMessage('Warranty request submitted successfully.')
      formElement.reset()
    }catch(error){
      console.error('warranty_claim_submit_failed',error)
      setWarrantyMessage('Unable to submit the warranty request. Please try again.')
    }finally{setBusy(null)}
  }

  return <div className="care-grid">
    <form className="panel" onSubmit={createSupport} aria-label="Product support request">
      <span className="kicker">SUPPORT</span><h2>Contact product care</h2>
      <label htmlFor="support-serial">Registered product (optional)</label>
      <select id="support-serial" className="field" name="serial_id" defaultValue=""><option value="">General support</option>{serials.map(s=><option key={s.id} value={s.id}>{s.product_name} · {s.serial_number}</option>)}</select>
      <label htmlFor="support-subject">Subject</label>
      <input id="support-subject" className="field" name="subject" minLength={3} maxLength={160} required placeholder="Subject" />
      <label htmlFor="support-message">How can we help?</label>
      <textarea id="support-message" className="field textarea" name="message" minLength={10} maxLength={5000} required placeholder="How can we help?" />
      <button className="pill light" disabled={busy==='support'}>{busy==='support'?'Submitting…':'Submit ticket →'}</button>
      {supportMessage?<p className="status-message" role="status" aria-live="polite">{supportMessage}</p>:null}
    </form>
    <form className="panel" onSubmit={createWarranty} aria-label="Warranty request">
      <span className="kicker">WARRANTY</span><h2>Start a warranty request</h2>
      <label htmlFor="warranty-serial">Registered product</label>
      <select id="warranty-serial" className="field" name="serial_id" required defaultValue=""><option value="" disabled>Select registered product</option>{serials.map(s=><option key={s.id} value={s.id}>{s.product_name} · {s.serial_number}</option>)}</select>
      <label htmlFor="warranty-issue">Issue type</label>
      <select id="warranty-issue" className="field" name="issue_type" defaultValue="product_issue"><option value="product_issue">Product issue</option><option value="adhesive_issue">Adhesive / installation</option><option value="physical_damage">Physical damage review</option><option value="other">Other</option></select>
      <label htmlFor="warranty-description">Describe the issue</label>
      <textarea id="warranty-description" className="field textarea" name="description" minLength={10} maxLength={5000} required placeholder="Describe the issue and what happened." />
      <button className="pill light" disabled={busy==='warranty'||serials.length===0}>{busy==='warranty'?'Submitting…':'Submit warranty request →'}</button>
      {serials.length===0?<p className="empty-state">Register a product before opening a warranty request.</p>:null}
      {warrantyMessage?<p className="status-message" role="status" aria-live="polite">{warrantyMessage}</p>:null}
    </form>
  </div>
}
