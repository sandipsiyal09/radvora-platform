'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      const callbackUrl = `${window.location.origin}/auth/callback?next=/account`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      })

      setMessage(error ? error.message : 'Check your email for the secure sign-in link.')
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
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send secure sign-in link'}</button>
        </form>
        {message ? <p className="status-message">{message}</p> : null}
      </section>
    </main>
  )
}
