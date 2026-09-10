import BusinessLeadForm from './lead-form'

export const metadata={title:'Business | RADVORA Technologies',description:'Corporate wellness, retail, distribution and OEM enquiries for RADVORA products.'}

export default function BusinessPage(){
  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA BUSINESS</span><h1>Build safer, better-documented device wellness programs.</h1><p>For corporate procurement, retail partnerships, distribution and OEM discussions. Product and scientific claims remain evidence-gated.</p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">CORPORATE</span><h2>Employee & enterprise programs</h2><p className="empty-state">Bulk deployment, onboarding, compatibility guidance and product registration workflows.</p></section>
      <section className="panel"><span className="kicker">CHANNEL</span><h2>Retail & distribution</h2><p className="empty-state">Structured partner onboarding, product education, authenticity verification and approved marketing assets.</p></section>
      <section className="panel"><span className="kicker">OEM</span><h2>Integration discussions</h2><p className="empty-state">Product design, packaging and technology collaboration subject to documented validation and commercial review.</p></section>
    </div>
    <BusinessLeadForm/>
  </div></main>
}
