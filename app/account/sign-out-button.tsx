'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function SignOutButton(){
  const router=useRouter()
  const [busy,setBusy]=useState(false)

  async function signOut(){
    setBusy(true)
    const supabase=createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return <button className="pill ghost" type="button" disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'}</button>
}
