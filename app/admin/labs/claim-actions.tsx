'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props={claimId:string;status:string}

type ReviewType='scientific'|'compliance'
type Decision='approved'|'rejected'|'changes_requested'

export default function ClaimActions({claimId,status}:Props){
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function send(body:Record<string,unknown>){
    setBusy(true);setMessage('')
    try{
      const response=await fetch(`/api/admin/labs/claims/${encodeURIComponent(claimId)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      })
      const result=await response.json() as {error?:string}
      if(!response.ok){setMessage(result.error||'Unable to update the claim.');return false}
      router.refresh();return true
    }catch(error){console.error('claim_control_request_failed',error);setMessage('Unable to update the claim.');return false}
    finally{setBusy(false)}
  }

  async function review(reviewType:ReviewType,decision:Decision){
    const ok=await send({action:'review',reviewType,decision})
    if(ok)setMessage(`${reviewType} review recorded.`)
  }

  async function publish(){
    if(!window.confirm('Publish this approved scientific claim? This action is externally consequential and requires both scientific and compliance approval.')) return
    const ok=await send({action:'publish'})
    if(ok)setMessage('Claim published.')
  }

  return <div className="admin-actions">
    {(status==='draft'||status==='scientific_review')?<><button disabled={busy} onClick={()=>review('scientific','approved')}>Scientific approve</button><button disabled={busy} onClick={()=>review('scientific','changes_requested')}>Request changes</button><button disabled={busy} onClick={()=>review('scientific','rejected')}>Reject</button></>:null}
    {status==='compliance_review'?<><button disabled={busy} onClick={()=>review('compliance','approved')}>Compliance approve</button><button disabled={busy} onClick={()=>review('compliance','changes_requested')}>Request changes</button><button disabled={busy} onClick={()=>review('compliance','rejected')}>Reject</button></>:null}
    {status==='approved'?<button disabled={busy} onClick={publish}>Publish approved claim</button>:null}
    {message?<small role="status">{message}</small>:null}
  </div>
}
