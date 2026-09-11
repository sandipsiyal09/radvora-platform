'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type Profile={legal_name:string|null;gstin:string|null;registered_state:string|null;registered_state_code:string|null;address_line1:string|null;address_line2:string|null;city:string|null;postal_code:string|null;support_email:string|null}
type ApiResponse={error?:string}

export default function SellerProfileForm({profile}: {profile:Profile}){
  const router=useRouter()
  const [form,setForm]=useState({
    legalName:profile.legal_name||'',gstin:profile.gstin||'',registeredState:profile.registered_state||'',registeredStateCode:profile.registered_state_code||'',
    addressLine1:profile.address_line1||'',addressLine2:profile.address_line2||'',city:profile.city||'',postalCode:profile.postal_code||'',supportEmail:profile.support_email||''
  })
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const setField=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}))

  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/admin/commerce/seller-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      let payload:ApiResponse={};try{payload=await response.json() as ApiResponse}catch{}
      if(!response.ok)throw new Error(payload.error||'Unable to save seller profile.')
      setMessage('Seller/invoice identity saved. Product commerce was disabled so the statutory profile can be reviewed before sales are re-enabled.')
      router.refresh()
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to save seller profile.')}
    finally{setBusy(false)}
  }

  return <form className="panel" onSubmit={submit} style={{display:'grid',gap:10}} aria-label="India seller and invoice identity">
    <p className="empty-state">Enter only verified legal and GST registration data. Saving this profile disables product commerce until founder/admin explicitly reviews and re-enables each sellable product.</p>
    <label>Seller legal name<input className="field" required maxLength={200} autoComplete="organization" value={form.legalName} onChange={e=>setField('legalName',e.target.value)}/></label>
    <div className="agent-control-line"><label>GSTIN<input className="field" required maxLength={15} value={form.gstin} onChange={e=>setField('gstin',e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,15))}/></label><label>Registered state code<input className="field" required inputMode="numeric" maxLength={2} value={form.registeredStateCode} onChange={e=>setField('registeredStateCode',e.target.value.replace(/\D/g,'').slice(0,2))}/></label></div>
    <label>Registered state<input className="field" required maxLength={100} autoComplete="address-level1" value={form.registeredState} onChange={e=>setField('registeredState',e.target.value)}/></label>
    <label>Registered address line 1<input className="field" required maxLength={180} autoComplete="address-line1" value={form.addressLine1} onChange={e=>setField('addressLine1',e.target.value)}/></label>
    <label>Registered address line 2<input className="field" maxLength={180} autoComplete="address-line2" value={form.addressLine2} onChange={e=>setField('addressLine2',e.target.value)}/></label>
    <div className="agent-control-line"><label>City<input className="field" required maxLength={100} autoComplete="address-level2" value={form.city} onChange={e=>setField('city',e.target.value)}/></label><label>PIN code<input className="field" required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.postalCode} onChange={e=>setField('postalCode',e.target.value.replace(/\D/g,'').slice(0,6))}/></label></div>
    <label>Customer / invoice support email<input className="field" required type="email" maxLength={320} autoComplete="email" value={form.supportEmail} onChange={e=>setField('supportEmail',e.target.value)}/></label>
    <div className="actions"><button className="pill light" type="submit" disabled={busy}>{busy?'Saving…':'Save verified seller identity →'}</button></div>
    {message?<p className="status-message" role="status" aria-live="polite">{message}</p>:null}
  </form>
}
