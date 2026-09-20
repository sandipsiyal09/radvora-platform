'use client'

import { FormEvent, useState } from 'react'
import ui from '../public-brand.module.css'

export default function LoginForm(){
  const [email,setEmail]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)

  async function handleLogin(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    const normalizedEmail=email.trim().toLowerCase()
    if(!normalizedEmail||normalizedEmail.length>254){setMessage('Enter a valid email address.');return}
    setLoading(true)
    setMessage('')
    try{
      const response=await fetch('/api/auth/magic-link',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:normalizedEmail}),
      })
      const result=await response.json().catch(()=>({})) as {message?:string;error?:string}
      if(!response.ok){setMessage(result.error||'Unable to send the sign-in link right now. Please try again shortly.');return}
      setMessage(result.message||'If the email can receive RADVORA sign-in links, check your inbox shortly.')
    }catch{
      setMessage('Unable to send the sign-in link right now. Please try again shortly.')
    }finally{
      setLoading(false)
    }
  }

  return <form onSubmit={handleLogin} className={ui.authForm}>
    <label className={ui.label} htmlFor="email">EMAIL ADDRESS
      <input className={ui.input} id="email" type="email" value={email} onChange={e=>setEmail(e.target.value.slice(0,254))} maxLength={254} autoComplete="email" required placeholder="you@example.com"/>
    </label>
    <button className={ui.primary} type="submit" disabled={loading}>{loading?'Sending…':'Send secure sign-in link →'}</button>
    {message?<p className={ui.authStatus} role="status" aria-live="polite">{message}</p>:null}
  </form>
}
