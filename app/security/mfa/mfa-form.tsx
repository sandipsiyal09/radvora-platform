'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Mode='loading'|'enroll'|'verify'

type Factor={id:string;status?:string;factor_type?:string}

export default function MfaForm({next}:{next:string}){
  const [mode,setMode]=useState<Mode>('loading')
  const [factorId,setFactorId]=useState('')
  const [qrCode,setQrCode]=useState('')
  const [secret,setSecret]=useState('')
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    let active=true
    ;(async()=>{
      try{
        const supabase=createClient()
        const assurance=await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if(assurance.error)throw assurance.error
        if(assurance.data.currentLevel==='aal2'){
          window.location.assign(next)
          return
        }
        const factors=await supabase.auth.mfa.listFactors()
        if(factors.error)throw factors.error
        const verified=(factors.data.totp||[]).find(f=>f.status==='verified')
        if(!active)return
        if(verified){setFactorId(verified.id);setMode('verify')}
        else setMode('enroll')
      }catch(error){
        console.error('mfa_bootstrap_failed',error)
        if(active){setMessage('Unable to initialize multi-factor authentication. Please sign in again and retry.');setMode('enroll')}
      }
    })()
    return()=>{active=false}
  },[next])

  async function startEnrollment(){
    setBusy(true);setMessage('')
    try{
      const supabase=createClient()
      const factors=await supabase.auth.mfa.listFactors()
      if(factors.error)throw factors.error
      const all=(factors.data.all||[]) as Factor[]
      for(const factor of all){
        if(factor.factor_type==='totp'&&factor.status==='unverified'){
          await supabase.auth.mfa.unenroll({factorId:factor.id})
        }
      }
      const enrolled=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'RADVORA privileged access'})
      if(enrolled.error)throw enrolled.error
      const qr=enrolled.data.totp.qr_code
      setFactorId(enrolled.data.id)
      setQrCode(qr.startsWith('data:')?qr:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`)
      setSecret(enrolled.data.totp.secret)
      setCode('')
      setMode('verify')
      setMessage('Scan the QR code with your authenticator app, then enter the six-digit code.')
    }catch(error){
      console.error('mfa_enrollment_failed',error)
      setMessage('Unable to start authenticator enrollment. Please retry.')
    }finally{setBusy(false)}
  }

  async function verify(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    const normalized=code.replace(/\s/g,'')
    if(!/^\d{6}$/.test(normalized)){setMessage('Enter the six-digit code from your authenticator app.');return}
    if(!factorId){setMessage('Authenticator setup is incomplete. Start setup again.');setMode('enroll');return}
    setBusy(true);setMessage('')
    try{
      const supabase=createClient()
      const challenge=await supabase.auth.mfa.challenge({factorId})
      if(challenge.error)throw challenge.error
      const verified=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:normalized})
      if(verified.error)throw verified.error
      const assurance=await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if(assurance.error||assurance.data.currentLevel!=='aal2')throw assurance.error||new Error('AAL2 session not established')
      window.location.assign(next)
    }catch(error){
      console.error('mfa_verification_failed',error)
      setMessage('The authenticator code could not be verified. Enter the current code and try again.')
      setCode('')
    }finally{setBusy(false)}
  }

  return <section className="panel" aria-labelledby="mfa-title">
    <span className="kicker">AAL2 SECURITY</span><h2 id="mfa-title">Authenticator verification</h2>
    {mode==='loading'?<p>Checking your privileged session…</p>:null}
    {mode==='enroll'?<>
      <p>No verified authenticator factor is available for this account. Set up TOTP before accessing founder/admin controls.</p>
      <button className="pill light" type="button" onClick={startEnrollment} disabled={busy}>{busy?'Starting…':'Set up authenticator'}</button>
    </>:null}
    {mode==='verify'?<>
      {qrCode?<div className="panel"><p><strong>1.</strong> Scan this QR code with Google Authenticator, Microsoft Authenticator, 1Password, Authy, or another TOTP app.</p><img src={qrCode} alt="RADVORA TOTP enrollment QR code" width={220} height={220}/>{secret?<p><strong>Manual setup key:</strong> <code>{secret}</code></p>:null}</div>:<p>Enter the current code from your enrolled authenticator app.</p>}
      <form onSubmit={verify} aria-label="Verify privileged multi-factor authentication">
        <label htmlFor="mfa-code">Six-digit authenticator code</label>
        <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} required/>
        <div className="actions"><button className="pill light" type="submit" disabled={busy}>{busy?'Verifying…':'Verify and continue'}</button>{qrCode?<button className="pill ghost" type="button" disabled={busy} onClick={startEnrollment}>Restart setup</button>:null}</div>
      </form>
    </>:null}
    {message?<p role="status" aria-live="polite">{message}</p>:null}
    <p>RADVORA never asks you to send the QR code, setup secret, or authenticator code by email or chat.</p>
  </section>
}
