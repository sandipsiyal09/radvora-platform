'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VerifyPage(){
  const [serial,setSerial]=useState('')
  const [checked,setChecked]=useState(false)

  return <main className="page-wrap">
    <div className="shell">
      <Link className="brand" href="/"><span>RADVORA</span><small>TECHNOLOGIES</small></Link>
      <div className="page-head">
        <span className="kicker">PRODUCT AUTHENTICATION</span>
        <h1>Verify your ShieldTag.</h1>
        <p>Every production RADVORA unit is designed to carry a unique serial and secure QR token. This interface is wired for the verification flow; live authenticity results will be connected to the production database.</p>
      </div>
      <div className="verify-grid">
        <section className="panel">
          <span className="kicker">SERIAL / QR</span>
          <h2>Enter product serial</h2>
          <input className="field" value={serial} onChange={e=>{setSerial(e.target.value);setChecked(false)}} placeholder="Example: RV-SP-XXXX-XXXX" />
          <div className="actions"><button className="pill light" onClick={()=>setChecked(true)} disabled={!serial.trim()}>Check product →</button><button className="pill ghost">Scan QR</button></div>
          <p style={{color:'#7f8ca1',lineHeight:1.7,fontSize:13}}>Prototype mode: no serial will be presented as genuine until a production database record and signed verification service are configured.</p>
        </section>
        <aside className="panel status-card">
          <span className="status-pill">{checked?'DATABASE CONNECTION REQUIRED':'AWAITING SERIAL'}</span>
          <h2 style={{fontSize:34,margin:'18px 0 8px'}}>{checked?'Verification not yet activated':'Authenticity status'}</h2>
          <p style={{color:'#8492a6',lineHeight:1.7}}>{checked?'The UI is ready. The next backend phase will resolve the serial against Product + SerialNumber + QR token records and return warranty, batch and approved report information.':'Enter or scan a RADVORA serial to begin verification.'}</p>
        </aside>
      </div>
    </div>
  </main>
}
