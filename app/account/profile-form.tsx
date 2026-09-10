'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Profile = { full_name: string | null; phone: string | null }

export default function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') || '').trim()
    const phone = String(form.get('phone') || '').trim()

    if (fullName.length > 120) {
      setMessage('Name must be 120 characters or fewer.')
      setBusy(false)
      return
    }
    if (phone.length > 32) {
      setMessage('Phone number must be 32 characters or fewer.')
      setBusy(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Please sign in again.')
      setBusy(false)
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    setMessage(error ? error.message : 'Profile saved.')
    setBusy(false)
  }

  return <form className="panel" onSubmit={saveProfile}>
    <span className="kicker">PROFILE</span><h2>Contact details</h2>
    <label className="field-label">Email</label>
    <input className="field" value={email} disabled aria-label="Account email" />
    <label className="field-label" htmlFor="profile-full-name">Full name</label>
    <input id="profile-full-name" className="field" name="full_name" maxLength={120} defaultValue={profile?.full_name || ''} autoComplete="name" placeholder="Your name" />
    <label className="field-label" htmlFor="profile-phone">Phone</label>
    <input id="profile-phone" className="field" name="phone" maxLength={32} defaultValue={profile?.phone || ''} autoComplete="tel" inputMode="tel" placeholder="Phone number" />
    <button className="pill light" disabled={busy}>{busy ? 'Saving…' : 'Save profile →'}</button>
    <p className="empty-state">Your sign-in email is managed by your authentication account and is not changed here.</p>
    {message ? <p className="status-message" role="status">{message}</p> : null}
  </form>
}
