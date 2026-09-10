'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Props={claimId:string;status:string}

export default function ClaimActions({claimId,status}:Props){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function review(reviewType:'scientific'|'compliance',decision:'approved'|'rejected'|'changes_requested'){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const {error}=await supabase.rpc('review_claim',{p_claim_id:claimId,p_review_type:reviewType,p_decision:decision,p_comment:null})
    setMessage(error?error.message:`${reviewType} review recorded. Refresh to see the new status.`)
    setBusy(false)
  }

  async function publish(){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const {error}=await supabase.rpc('publish_claim',{p_claim_id:claimId})
    setMessage(error?error.message:'Claim published. Refresh to see the new status.')
    setBusy(false)
  }

  return <div className="admin-actions">
    {(status==='draft'||status==='scientific_review')?<><button disabled={busy} onClick={()=>review('scientific','approved')}>Scientific approve</button><button disabled={busy} onClick={()=>review('scientific','changes_requested')}>Request changes</button><button disabled={busy} onClick={()=>review('scientific','rejected')}>Reject</button></>:null}
    {status==='compliance_review'?<><button disabled={busy} onClick={()=>review('compliance','approved')}>Compliance approve</button><button disabled={busy} onClick={()=>review('compliance','changes_requested')}>Request changes</button><button disabled={busy} onClick={()=>review('compliance','rejected')}>Reject</button></>:null}
    {status==='approved'?<button disabled={busy} onClick={publish}>Publish approved claim</button>:null}
    {message?<small>{message}</small>:null}
  </div>
}
