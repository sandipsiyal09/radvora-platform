import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import AgentControls from './agent-controls'
import ApprovalActions from './approval-actions'

export const dynamic = 'force-dynamic'

export default async function AICommandCenterPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if(!user){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">AI COMMAND CENTER</p><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>
  }

  const role = user.app_metadata?.role
  if(role !== 'admin' && role !== 'founder'){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">ACCESS CONTROL</p><h1>Founder/admin access required.</h1></section></div></main>
  }

  const [{ data: agents }, { data: runs }, { data: approvals }, { data: tools }] = await Promise.all([
    supabase.from('ai_agents').select('id,name,department,objective,autonomy_level,enabled,allowed_tools').order('department').order('name'),
    supabase.from('ai_agent_runs').select('id,status,input_summary,output_summary,created_at,agent_id').order('created_at',{ascending:false}).limit(12),
    supabase.from('approvals').select('id,approval_type,summary,status,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('agent_tools').select('tool_key,display_name,risk_level,enabled').order('risk_level').order('display_name'),
  ])

  const enabledCount = agents?.filter(a=>a.enabled).length ?? 0
  const toolRows = tools ?? []

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA AUTONOMOUS COMPANY OS</span><h1>AI Command Center.</h1><p>Agents can only use explicitly enabled tools. High-risk publishing, money movement and scientific claims remain human-gated. Level 5 autonomy is disabled.</p></section>
    <div className="command-stats"><div className="panel"><span>Registered agents</span><b>{agents?.length ?? 0}</b></div><div className="panel"><span>Enabled agents</span><b>{enabledCount}</b></div><div className="panel"><span>Recent runs</span><b>{runs?.length ?? 0}</b></div><div className="panel"><span>Approval queue</span><b>{approvals?.filter(a=>a.status==='pending').length ?? 0}</b></div></div>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">AGENT ROSTER</span><h2>Company intelligence</h2>{agents?.map(a=><div className="admin-row" key={a.id}><div style={{flex:1}}><b>{a.name}</b><span>{a.department} · L{a.autonomy_level}</span><p className="empty-state">{a.objective}</p><AgentControls agentId={a.id} enabled={a.enabled} autonomyLevel={a.autonomy_level} allowedTools={Array.isArray(a.allowed_tools)?a.allowed_tools:[]} tools={toolRows}/></div><em>{a.enabled?'enabled':'disabled'}</em></div>)}</section>
      <section className="panel"><span className="kicker">RECENT RUNS</span><h2>Execution history</h2>{runs?.length ? runs.map(r=><div className="admin-row" key={r.id}><div><b>{r.status}</b><span>{r.input_summary || 'No summary'}</span></div><em>{new Date(r.created_at).toLocaleDateString('en-IN')}</em></div>) : <p className="empty-state">No agent runs yet.</p>}</section>
      <section className="panel"><span className="kicker">HUMAN APPROVALS</span><h2>Safety gate</h2>{approvals?.length ? approvals.map(a=><div className="admin-row" key={a.id}><div style={{flex:1}}><b>{a.approval_type}</b><span>{a.summary}</span><ApprovalActions approvalId={a.id} status={a.status}/></div><em>{a.status}</em></div>) : <p className="empty-state">No approval requests yet.</p>}</section>
    </div>
  </div></main>
}
