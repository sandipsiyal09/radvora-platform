import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

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

  const [{ data: agents }, { data: runs }, { data: approvals }] = await Promise.all([
    supabase.from('ai_agents').select('id,name,department,objective,autonomy_level,enabled').order('department').order('name'),
    supabase.from('ai_agent_runs').select('id,status,input_summary,output_summary,created_at,agent_id').order('created_at',{ascending:false}).limit(12),
    supabase.from('approvals').select('id,approval_type,summary,status,created_at').order('created_at',{ascending:false}).limit(12),
  ])

  const enabledCount = agents?.filter(a=>a.enabled).length ?? 0

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA AUTONOMOUS COMPANY OS</span><h1>AI Command Center.</h1><p>Thirty specialist agents are registered. They remain disabled until their tool permissions, autonomy limits and human approval rules are configured.</p></section>
    <div className="command-stats"><div className="panel"><span>Registered agents</span><b>{agents?.length ?? 0}</b></div><div className="panel"><span>Enabled agents</span><b>{enabledCount}</b></div><div className="panel"><span>Recent runs</span><b>{runs?.length ?? 0}</b></div><div className="panel"><span>Approval queue</span><b>{approvals?.filter(a=>a.status==='pending').length ?? 0}</b></div></div>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">AGENT ROSTER</span><h2>Company intelligence</h2>{agents?.map(a=><div className="admin-row" key={a.id}><div><b>{a.name}</b><span>{a.department} · L{a.autonomy_level}</span></div><em>{a.enabled?'enabled':'disabled'}</em></div>)}</section>
      <section className="panel"><span className="kicker">RECENT RUNS</span><h2>Execution history</h2>{runs?.length ? runs.map(r=><div className="admin-row" key={r.id}><div><b>{r.status}</b><span>{r.input_summary || 'No summary'}</span></div><em>{new Date(r.created_at).toLocaleDateString('en-IN')}</em></div>) : <p className="empty-state">No agent runs yet.</p>}</section>
      <section className="panel"><span className="kicker">HUMAN APPROVALS</span><h2>Safety gate</h2>{approvals?.length ? approvals.map(a=><div className="admin-row" key={a.id}><div><b>{a.approval_type}</b><span>{a.summary}</span></div><em>{a.status}</em></div>) : <p className="empty-state">No approval requests yet.</p>}</section>
    </div>
  </div></main>
}
