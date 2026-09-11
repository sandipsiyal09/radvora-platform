'use client'

import { FormEvent, useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail=email.trim().toLowerCase()
    if(!normalizedEmail||normalizedEmail.length>254){setMessage('Enter a valid email address.');return}
    setLoading(true)
    setMessage('')

    try {
      const response=await fetch('/api/auth/magic-link',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:normalizedEmail}),
      })
      const result=await response.json().catch(()=>({})) as {message?:string;error?:string}
      if(!response.ok){
        setMessage(result.error||'Unable to send the sign-in link right now. Please try again shortly.')
        return
      }
      setMessage(result.message||'Check your email for the secure sign-in link.')
    } catch(error) {
      console.error('passwordless_login_request_failed',error)
      setMessage('Unable to send the sign-in link right now. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="glass-card auth-card">
        <p className="eyebrow">RADVORA ACCOUNT</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to manage registered products, warranty, orders and support.</p>
        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value.slice(0,254))} maxLength={254} autoComplete="email" required placeholder="you@example.com" />
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send secure sign-in link'}</button>
        </form>
        {message ? <p className="status-message" role="status">{message}</p> : null}
      </section>
    </main>
  )
}
