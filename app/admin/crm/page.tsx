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

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">SALES & PARTNERSHIPS</span><h1>RADVORA CRM.</h1><p>Dealer, distributor, corporate and direct-sales opportunities share one pipeline for the sales and autonomous agent layer.</p></section>
    <div className="command-stats"><div className="panel"><span>Total leads</span><b>{leads?.length ?? 0}</b></div><div className="panel"><span>New</span><b>{counts.new || 0}</b></div><div className="panel"><span>Qualified</span><b>{counts.qualified || 0}</b></div><div className="panel"><span>Won</span><b>{counts.won || 0}</b></div></div>
    <section className="panel"><span className="kicker">PIPELINE</span><h2>Recent opportunities</h2>{leads?.length ? leads.map(l=><div className="admin-row" key={l.id}><div><b>{l.company || l.full_name || 'Unnamed lead'}</b><span>{l.segment || 'Unsegmented'} · {l.source || 'Unknown source'} · Score {l.score}</span></div><em>{l.status}</em></div>) : <p className="empty-state">No leads yet. Lead-generation agents will write qualified prospects here after their source rules and approval limits are configured.</p>}</section>
  </div></main>
}
