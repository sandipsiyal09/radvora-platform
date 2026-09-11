'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApprovalActions({approvalId,status}:{approvalId:string;status:string}){
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  if(status!=='pending') return null

  async function decide(decision:'approved'|'rejected'|'changes_requested'){
    if(decision==='approved'&&!window.confirm('Approve this human-gated action? Confirm the request details and downstream effect before continuing.')) return
    setBusy(true);setMessage('')
    try{
      const response=await fetch(`/api/admin/ai/approvals/${encodeURIComponent(approvalId)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision})
      })
      const result=await response.json() as {error?:string}
      if(!response.ok){setMessage(result.error||'Unable to resolve approval.');return}
      setMessage(`Approval ${decision}.`);router.refresh()
    }catch(error){console.error('approval_decision_request_failed',error);setMessage('Unable to resolve approval.')}
    finally{setBusy(false)}
  }

  return <div className="admin-actions">
    <button disabled={busy} onClick={()=>decide('approved')}>Approve</button>
    <button disabled={busy} onClick={()=>decide('changes_requested')}>Request changes</button>
    <button disabled={busy} onClick={()=>decide('rejected')}>Reject</button>
    {message?<small role="status">{message}</small>:null}
  </div>
}
