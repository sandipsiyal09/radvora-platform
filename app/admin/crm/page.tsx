import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CRMPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if(!user){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA CRM</p><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in</Link></section></div></main>
  }

  const role = user.app_metadata?.role
  if(role !== 'admin' && role !== 'founder'){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">ACCESS CONTROL</p><h1>Founder/admin access required.</h1></section></div></main>
  }

  const { data: leads } = await supabase.from('leads').select('id,full_name,company,email,phone,source,segment,status,score,created_at').order('created_at',{ascending:false}).limit(50)
  const counts = (leads || []).reduce<Record<string,number>>((acc,l)=>{acc[l.status]=(acc[l.status]||0)+1;return acc},{})
  const privacyCount=(leads||[]).filter(lead=>lead.segment==='privacy').length

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">CRM & REQUEST INTAKE</span><h1>RADVORA CRM.</h1><p>Dealer, distributor, corporate and direct-sales opportunities share the commercial pipeline. Privacy requests are clearly segmented so they can be handled separately from sales outreach.</p></section>
    <div className="command-stats"><div className="panel"><span>Recent records</span><b>{leads?.length ?? 0}</b></div><div className="panel"><span>New</span><b>{counts.new || 0}</b></div><div className="panel"><span>Privacy requests</span><b>{privacyCount}</b></div><div className="panel"><span>Won</span><b>{counts.won || 0}</b></div></div>
    <section className="panel"><span className="kicker">PIPELINE & REQUESTS</span><h2>Recent intake</h2>{leads?.length ? leads.map(l=><div className="admin-row" key={l.id}><div><b>{l.segment==='privacy'?`Privacy request · ${l.full_name||'Requester'}`:(l.company || l.full_name || 'Unnamed lead')}</b><span>{l.segment || 'Unsegmented'} · {l.source || 'Unknown source'}{l.segment==='privacy'?'':` · Score ${l.score}`}</span></div><em>{l.status}</em></div>) : <p className="empty-state">No intake records yet.</p>}</section>
  </div></main>
}
