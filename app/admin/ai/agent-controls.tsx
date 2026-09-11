'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Tool={tool_key:string;display_name:string;risk_level:string;enabled:boolean}
type Props={agentId:string;enabled:boolean;autonomyLevel:number;allowedTools:string[];tools:Tool[]}

export default function AgentControls({agentId,enabled,autonomyLevel,allowedTools,tools}:Props){
  const router=useRouter()
  const [isEnabled,setIsEnabled]=useState(enabled)
  const [level,setLevel]=useState(autonomyLevel)
  const [selected,setSelected]=useState<string[]>(allowedTools||[])
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const activeTools=useMemo(()=>tools.filter(t=>t.enabled),[tools])

  function toggleTool(key:string){setSelected(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key])}

  async function save(){
    if(isEnabled&&!selected.length){setMessage('Enabled agents require at least one explicitly allowed tool.');return}
    if(level===4&&!window.confirm('Enable Level 4 autonomy? This remains founder-only and all external publishing, money movement and claims stay approval-gated.')) return
    setBusy(true);setMessage('')
    const guardrails={max_daily_actions:20,max_daily_outreach:0,max_single_spend:0,max_daily_spend:0,require_approval_for_external_publish:true,require_approval_for_money:true,require_approval_for_claims:true,allowed_domains:[]}
    try{
      const response=await fetch(`/api/admin/ai/agents/${encodeURIComponent(agentId)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:isEnabled,autonomyLevel:level,allowedTools:selected,guardrails})
      })
      const result=await response.json() as {error?:string}
      if(!response.ok){setMessage(result.error||'Unable to save agent controls.');return}
      setMessage('Configuration saved.');router.refresh()
    }catch(error){console.error('agent_config_request_failed',error);setMessage('Unable to save agent controls.')}
    finally{setBusy(false)}
  }

  return <div className="agent-control-box">
    <div className="agent-control-line">
      <label><input type="checkbox" checked={isEnabled} onChange={e=>setIsEnabled(e.target.checked)}/> Enabled</label>
      <label>Autonomy <select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>L{n}</option>)}</select></label>
    </div>
    <div className="tool-grid">{activeTools.map(t=><label key={t.tool_key} className="tool-chip"><input type="checkbox" checked={selected.includes(t.tool_key)} onChange={()=>toggleTool(t.tool_key)}/>{t.display_name}<small>{t.risk_level}</small></label>)}</div>
    <div className="actions"><button className="pill ghost" disabled={busy} onClick={save}>{busy?'Saving…':'Save controls'}</button></div>
    {message?<small className="status-message" role="status">{message}</small>:null}
  </div>
}
