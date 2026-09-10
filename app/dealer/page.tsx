import BusinessLeadForm from '../business/lead-form'

export const metadata={title:'Dealer Program',description:'Apply to become a RADVORA retail or dealer partner.'}

export default function DealerPage(){
  return <main className="page-wrap"><div className="shell">
    <section className="page-head"><span className="kicker">RADVORA DEALER PROGRAM</span><h1>Bring RADVORA to your customers.</h1><p>Dealer onboarding includes authenticity verification, approved product education, compatibility guidance and access to evidence-controlled marketing materials.</p></section>
    <div className="admin-grid">
      <section className="panel"><span className="kicker">AUTHENTICITY</span><h2>Verified products</h2><p className="empty-state">Every production unit can be linked to RADVORA serial and QR authentication workflows.</p></section>
      <section className="panel"><span className="kicker">ENABLEMENT</span><h2>Approved sales assets</h2><p className="empty-state">Dealer material must use only product information and claims approved for publication.</p></section>
      <section className="panel"><span className="kicker">SUPPORT</span><h2>Structured escalation</h2><p className="empty-state">Compatibility, registration, warranty and customer-care workflows are built into the platform.</p></section>
    </div>
    <BusinessLeadForm source="dealer-page" title="Apply for dealer onboarding"/>
  </div></main>
}
