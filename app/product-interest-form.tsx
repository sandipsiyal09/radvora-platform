'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import ui from './public-brand.module.css'

export default function ProductInterestForm({
  context,
  source='product-interest',
  compact=false,
}:{context:string;source?:'product-interest'|'shieldlab-interest';compact?:boolean}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [consent,setConsent]=useState(false)

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    if(!consent)return
    setBusy(true)
    setMessage('')
    const data=new FormData(e.currentTarget)
    try{
      const response=await fetch('/api/business-leads',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          email:String(data.get('email')||''),
          source,
          context,
          consent:true,
          website:String(data.get('website')||'')
        })
      })
      const payload=await response.json().catch(()=>({})) as {error?:string}
      if(!response.ok){setMessage(payload.error||'We could not save your availability request. Please try again shortly.');return}
      setMessage('Availability request saved. We will use this email only for the requested RADVORA availability update.')
      e.currentTarget.reset()
      setConsent(false)
    }catch{
      setMessage('We could not save your availability request. Please try again shortly.')
    }finally{
      setBusy(false)
    }
  }

  const formId=`${source}-email`
  return <form className={compact?ui.interestCompact:ui.interestBox} onSubmit={submit} aria-label="Product availability updates">
    <div className={ui.interestCopy}>
      <span className={ui.kicker}>AVAILABILITY UPDATE</span>
      <b>Want this when legitimate availability opens?</b>
      <small>{context}</small>
    </div>
    <div aria-hidden="true" style={{position:'absolute',left:'-10000px',width:1,height:1,overflow:'hidden'}}>
      <label htmlFor={`${formId}-website`}>Website</label>
      <input id={`${formId}-website`} name="website" tabIndex={-1} autoComplete="off"/>
    </div>
    <div className={ui.interestRow}>
      <label className={ui.formLabel} htmlFor={formId}>Email</label>
      <input id={formId} className={ui.formField} name="email" type="email" required maxLength={320} autoComplete="email" placeholder="you@example.com"/>
      <button className={ui.primary} type="submit" disabled={busy||!consent}>{busy?'Saving…':'Notify me →'}</button>
    </div>
    <label className={ui.interestConsent}>
      <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>
      <span>Email me when RADVORA publishes availability for this selection. This is not an order, reservation, price lock or stock guarantee. See the <Link href="/privacy">Privacy Policy</Link>.</span>
    </label>
    {message?<p className={ui.formStatus} role="status" aria-live="polite">{message}</p>:null}
  </form>
}
