'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function ApprovalActions({approvalId,status}:{approvalId:string;status:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  if(status!=='pending') return null

  async function decide(decision:'approved'|'rejected'|'changes_requested'){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const {error}=await supabase.rpc('decide_approval',{p_approval_id:approvalId,p_decision:decision,p_comment:null})
    setMessage(error?error.message:`Approval ${decision}. Refresh to update queue.`)
    setBusy(false)
  }

  return <div className="admin-actions">
    <button disabled={busy} onClick={()=>decide('approved')}>Approve</button>
    <button disabled={busy} onClick={()=>decide('changes_requested')}>Request changes</button>
    <button disabled={busy} onClick={()=>decide('rejected')}>Reject</button>
    {message?<small>{message}</small>:null}
  </div>
}
