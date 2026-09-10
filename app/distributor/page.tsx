import BusinessLeadForm from '../business/lead-form'

export const metadata={title:'Distributor Program',description:'Apply to become a RADVORA distribution partner.'}

export default function DistributorPage(){
  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA DISTRIBUTOR PROGRAM</span><h1>Scale RADVORA responsibly.</h1><p>For regional and national distribution partners seeking structured product authentication, channel support and evidence-controlled marketing.</p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">CHANNEL</span><h2>Territory planning</h2><p className="empty-state">Distribution discussions can be qualified by geography, channel, expected volume and operational readiness.</p></section>
      <section className="panel"><span className="kicker">CONTROL</span><h2>Traceable inventory</h2><p className="empty-state">Serialized products and registration workflows support downstream authenticity and customer-care processes.</p></section>
      <section className="panel"><span className="kicker">GOVERNANCE</span><h2>Approved communication</h2><p className="empty-state">Channel claims stay constrained to evidence that has passed RADVORA scientific and compliance review.</p></section>
    </div>
    <BusinessLeadForm source="distributor-page" title="Apply for distribution partnership"/>
  </div></main>
}
