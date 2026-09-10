import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="page-wrap">
        <div className="shell">
          <section className="glass bento-card">
            <p className="kicker">RADVORA ACCOUNT</p>
            <h1>Sign in to continue.</h1>
            <p>Manage registered products, warranty, orders and support.</p>
            <Link className="pill light" href="/login">Sign in</Link>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap">
      <div className="shell">
        <section className="page-head">
          <p className="kicker">MY RADVORA</p>
          <h1>Your account.</h1>
          <p>Secure customer area for products, warranty, orders and support.</p>
        </section>
      </div>
    </main>
  )
}
