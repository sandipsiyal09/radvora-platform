'use client'

import { useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Tool={tool_key:string;display_name:string;risk_level:string;enabled:boolean}

type Props={agentId:string;enabled:boolean;autonomyLevel:number;allowedTools:string[];tools:Tool[]}

export default function AgentControls({agentId,enabled,autonomyLevel,allowedTools,tools}:Props){
  const [isEnabled,setIsEnabled]=useState(enabled)
  const [level,setLevel]=useState(autonomyLevel)
  const [selected,setSelected]=useState<string[]>(allowedTools||[])
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const activeTools=useMemo(()=>tools.filter(t=>t.enabled),[tools])

  function toggleTool(key:string){setSelected(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key])}

  async function save(){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const guardrails={
      max_daily_actions:20,
      max_daily_outreach:0,
      max_single_spend:0,
      max_daily_spend:0,
      require_approval_for_external_publish:true,
      require_approval_for_money:true,
      require_approval_for_claims:true,
      allowed_domains:[]
    }
    const {error}=await supabase.rpc('set_agent_configuration',{
      p_agent_id:agentId,
      p_enabled:isEnabled,
      p_autonomy_level:level,
      p_allowed_tools:selected,
      p_guardrails:guardrails
    })
    setMessage(error?error.message:'Configuration saved. Refresh to see the canonical state.')
    setBusy(false)
  }

  return <div className="agent-control-box">
    <div className="agent-control-line">
      <label><input type="checkbox" checked={isEnabled} onChange={e=>setIsEnabled(e.target.checked)}/> Enabled</label>
      <label>Autonomy <select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>L{n}</option>)}</select></label>
    </div>
    <div className="tool-grid">{activeTools.map(t=><label key={t.tool_key} className="tool-chip"><input type="checkbox" checked={selected.includes(t.tool_key)} onChange={()=>toggleTool(t.tool_key)}/>{t.display_name}<small>{t.risk_level}</small></label>)}</div>
    <div className="actions"><button className="pill ghost" disabled={busy} onClick={save}>{busy?'Saving…':'Save controls'}</button></div>
    {message?<small className="status-message">{message}</small>:null}
  </div>
}
