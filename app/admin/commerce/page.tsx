import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import SellerProfileForm from './seller-profile-form'

export const dynamic='force-dynamic'

export default async function CommerceAdminPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">INDIA COMMERCE</span><h1>Authentication required.</h1><Link className="pill light" href="/login">Sign in →</Link></section></div></main>
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder')return <main className="page-wrap"><div className="shell"><section className="panel"><span className="kicker">ACCESS CONTROL</span><h1>Founder/admin access required.</h1></section></div></main>

  const admin=createAdminClient()
  const [{data:profile,error:profileError},{data:ready,error:readyError}]=await Promise.all([
    admin.from('india_seller_profile').select('legal_name,gstin,registered_state,registered_state_code,address_line1,address_line2,city,postal_code,support_email,updated_at').eq('profile_key','primary').maybeSingle(),
    admin.rpc('server_india_seller_profile_ready')
  ])
  const current=profile||{legal_name:null,gstin:null,registered_state:null,registered_state_code:null,address_line1:null,address_line2:null,city:null,postal_code:null,support_email:null}
  const isReady=!profileError&&!readyError&&ready===true

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA INDIA COMMERCE · INTERNAL</span><h1>Seller and invoice identity.</h1><p>This profile is a hard launch gate for India consumer sales. Enter only verified legal/GST registration data. RADVORA does not infer or fabricate statutory seller information.</p></section>
    <section className="panel"><span className="kicker">CURRENT STATE</span><h2>{isReady?'Seller profile configured.':'Seller profile incomplete.'}</h2><p>{isReady?'The profile satisfies RADVORA’s configured identity fields. Product pricing, GST/HSN, inventory, gateway and deployment gates still apply.':'Commerce cannot be enabled until legal name, GSTIN, registered state/address, PIN and support email are saved.'}</p>{profile?.updated_at?<p className="empty-state">Last updated {new Date(profile.updated_at).toLocaleString('en-IN')}.</p>:null}</section>
    <SellerProfileForm profile={current}/>
    <div className="actions"><Link className="pill ghost" href="/admin">← Admin dashboard</Link><Link className="pill ghost" href="/admin/readiness">Launch readiness</Link><Link className="pill ghost" href="/admin/catalog">Catalog</Link></div>
  </div></main>
}
