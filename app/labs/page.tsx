import Link from 'next/link'

const cards=[
  {title:'Testing methodology',body:'Document device, network, band, placement, instrumentation, baseline and product-on measurements so every result is reproducible.'},
  {title:'Claims governance',body:'Marketing claims must reference approved test evidence and pass scientific and compliance review before publication.'},
  {title:'Device compatibility',body:'Store phone model, variant, network conditions and product revision so results are never generalized beyond the tested configuration.'},
  {title:'Public reports',body:'Publish approved summaries and report files without inventing certifications, measurements or health outcomes.'}
]

export default function LabsPage(){
  return <main className="page-wrap">
    <div className="shell">
      <Link className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></Link>
      <div className="page-head"><span className="kicker">RADVORA LABS</span><h1>Science made inspectable.</h1><p>RADVORA Labs is the evidence layer for the company. The production system will connect approved measurements, device conditions, reports and claims so the website can show exactly what was tested—and nothing more.</p></div>
      <div className="subnav"><Link className="pill ghost" href="/verify">Verify product</Link><Link className="pill ghost" href="/">Back to homepage</Link></div>
      <div className="lab-grid">{cards.map((card,i)=><article className="panel lab-card" key={card.title}><span className="kicker">0{i+1}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>
      <section className="panel" style={{marginTop:18}}><span className="kicker">REPORT STATUS</span><h2 style={{fontSize:34}}>No verified performance reports published yet.</h2><p style={{color:'#8492a6',lineHeight:1.7,maxWidth:850}}>This is intentional. The platform will only display numerical RF-performance results after real testing data is entered, reviewed and approved. Prototype UI data must remain clearly labeled as demo information.</p></section>
    </div>
  </main>
}
