import type { Metadata } from 'next'
import { PublicShell } from '../public-shell'
import ui from '../public-brand.module.css'
import LoginForm from './login-form'

export const metadata:Metadata={
  title:'Sign in',
  description:'Sign in securely to your RADVORA account to manage orders, registered products, warranty and support.',
  alternates:{canonical:'/login'}
}

export default function LoginPage(){
  return <PublicShell><main className={ui.main}>
    <section className={ui.hero}>
      <div className={ui.heroCopy}>
        <span className={ui.kicker}>MY RADVORA</span>
        <h1>Your products.<br/><em>Your record.</em></h1>
        <p>Sign in with a secure email link to manage orders, registered products, warranty and support without creating another password.</p>
      </div>
      <aside className={ui.heroAside}>
        <span>SECURE ACCESS</span>
        <strong>Passwordless sign-in.</strong>
        <p>RADVORA sends a short-lived sign-in link to your email. Account access remains separate from product verification and compatibility status.</p>
      </aside>
    </section>
    <section className={ui.section}>
      <div className={ui.grid2}>
        <article className={ui.compatPanel}>
          <span className={ui.kicker}>SIGN IN</span>
          <h3>Continue to your account.</h3>
          <LoginForm/>
        </article>
        <article className={ui.compatPanel}>
          <span className={ui.kicker}>WHAT YOU CAN MANAGE</span>
          <h3>One place for the ownership journey.</h3>
          <p>Track governed orders, register supported serialized products, review warranty activity and keep customer-care history connected to your account.</p>
          <div className={ui.notice}>A RADVORA account does not create or alter a compatibility result. Device fit remains controlled by the reviewed compatibility registry.</div>
        </article>
      </div>
    </section>
  </main></PublicShell>
}
