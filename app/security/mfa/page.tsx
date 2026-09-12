import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '../../../lib/supabase/server'
import MfaForm from './mfa-form'

export const dynamic='force-dynamic'
export const metadata:Metadata={robots:{index:false,follow:false,nocache:true}}

function safeNext(value:string|undefined){
  if(!value)return '/admin'
  if(value.length>500||/[\\\u0000-\u001f\u007f]/.test(value))return '/admin'
  if(!value.startsWith('/admin')||value.startsWith('//'))return '/admin'
  return value
}

export default async function PrivilegedMfaPage({searchParams}:{searchParams:Promise<{next?:string}>}){
  const params=await searchParams
  const next=safeNext(params.next)
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/login')
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder')redirect('/account')

  const {data:assurance}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if(assurance?.currentLevel==='aal2')redirect(next)

  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">PRIVILEGED ACCESS</span><h1>Multi-factor authentication required.</h1><p>Founder and admin controls require a verified authenticator code in addition to your primary sign-in. Payment, seller, inventory, scientific and AI administration remains locked until this session reaches AAL2.</p></section>
    <MfaForm next={next}/>
  </div></main>
}
