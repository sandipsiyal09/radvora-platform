import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LabsAdminPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if(!user){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">RADVORA ADMIN</p><h1>Authentication required.</h1><p>Sign in to access internal laboratory and claims workflows.</p><Link className="pill light" href="/login">Sign in</Link></section></div></main>
  }

  const role = user.app_metadata?.role
  if(role !== 'admin' && role !== 'founder'){
    return <main className="page-wrap"><div className="shell"><section className="glass bento-card"><p className="kicker">ACCESS CONTROL</p><h1>Admin access required.</h1><p>Your account is authenticated but does not have access to internal scientific review workflows.</p></section></div></main>
  }

  const [{ data: reports }, { data: claims }, { data: tests }] = await Promise.all([
    supabase.from('lab_reports').select('id,report_number,title,laboratory_name,report_date,status,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('claims').select('id,claim_text,category,status,valid_from,valid_until,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('rf_tests').select('id,phone_manufacturer,phone_model,network,frequency_band,methodology,status,created_at').order('created_at',{ascending:false}).limit(20),
  ])

  return <main className="page-wrap"><div className="shell">
    <div className="page-head"><span className="kicker">RADVORA LABS · INTERNAL</span><h1>Evidence & claims control.</h1><p>Draft evidence remains internal until scientific and compliance review is complete. Publishing is intentionally separated from data entry.</p></div>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">LAB REPORTS</span><h2>{reports?.length ?? 0} recent</h2>{reports?.length ? reports.map(r=><div className="admin-row" key={r.id}><div><b>{r.report_number}</b><span>{r.title}</span></div><em>{r.status}</em></div>) : <p className="empty-state">No lab reports entered yet.</p>}</section>
      <section className="panel"><span className="kicker">RF TESTS</span><h2>{tests?.length ?? 0} recent</h2>{tests?.length ? tests.map(t=><div className="admin-row" key={t.id}><div><b>{t.phone_manufacturer} {t.phone_model}</b><span>{t.network || 'Network pending'} · {t.frequency_band || 'Band pending'}</span></div><em>{t.status}</em></div>) : <p className="empty-state">No RF tests entered yet.</p>}</section>
      <section className="panel"><span className="kicker">CLAIMS QUEUE</span><h2>{claims?.length ?? 0} recent</h2>{claims?.length ? claims.map(c=><div className="admin-row" key={c.id}><div><b>{c.category}</b><span>{c.claim_text}</span></div><em>{c.status}</em></div>) : <p className="empty-state">No claims awaiting review.</p>}</section>
    </div>
  </div></main>
}
