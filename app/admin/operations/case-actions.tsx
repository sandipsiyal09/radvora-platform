'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Kind='support'|'warranty'
type Props={kind:Kind;id:string;status:string}
type ApiResponse={error?:string}

const supportTransitions:Record<string,string[]>={open:['in_progress','resolved','closed'],in_progress:['waiting_customer','resolved','closed'],waiting_customer:['in_progress','resolved','closed'],resolved:['in_progress','closed'],closed:['in_progress']}
const warrantyTransitions:Record<string,string[]>={submitted:['reviewing','rejected'],reviewing:['approved','rejected'],approved:['replacement_processing','closed'],replacement_processing:['closed'],rejected:['reviewing','closed'],closed:[]}
const label=(value:string)=>value.replaceAll('_',' ')

export default function CaseActions({kind,id,status}:Props){
  const router=useRouter();const options=(kind==='support'?supportTransitions:warrantyTransitions)[status]??[]
  const [next,setNext]=useState(options[0]??'');const [note,setNote]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('')
  if(!options.length)return <span className="empty-state">No further transitions</span>

  async function submit(){
    if(!next)return
    setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/admin/operations/transition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id,status:next,note})})
      let payload:ApiResponse={};try{payload=await response.json() as ApiResponse}catch{}
      if(!response.ok)throw new Error(payload.error||'Unable to update case.')
      setMessage('Updated');router.refresh()
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to update case.')}
    finally{setBusy(false)}
  }

  const noteRequired=kind==='warranty'&&(next==='rejected'||next==='closed')
  return <div style={{display:'grid',gap:8,marginTop:10}}>
    <select className="field" value={next} onChange={e=>setNext(e.target.value)} disabled={busy}>{options.map(option=><option key={option} value={option}>{label(option)}</option>)}</select>
    <textarea className="field" rows={2} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} placeholder={noteRequired?'Resolution note required':'Internal audit note (optional)'} required={noteRequired}/>
    <button className="pill light" type="button" disabled={busy||noteRequired&&!note.trim()} onClick={submit}>{busy?'Updating…':'Apply status →'}</button>
    {message?<span className="status-message" role="status">{message}</span>:null}
  </div>
}
