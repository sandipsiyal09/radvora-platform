'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Props={product:{id:string;name:string;short_description:string|null;description:string|null;price_inr:number|null;status:string}}

export default function ProductEditor({product}:Props){
  const [name,setName]=useState(product.name)
  const [shortDescription,setShortDescription]=useState(product.short_description||'')
  const [description,setDescription]=useState(product.description||'')
  const [price,setPrice]=useState(product.price_inr?.toString()||'')
  const [status,setStatus]=useState(product.status)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function save(){
    setBusy(true);setMessage('')
    const supabase=createClient()
    const {error}=await supabase.rpc('update_product_catalog',{
      p_product_id:product.id,
      p_name:name,
      p_short_description:shortDescription,
      p_description:description,
      p_price_inr:price===''?null:Number(price),
      p_status:status
    })
    setMessage(error?error.message:'Catalog record saved.')
    setBusy(false)
  }

  return <div className="catalog-editor">
    <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="Product name"/>
    <input className="field" value={shortDescription} onChange={e=>setShortDescription(e.target.value)} placeholder="Short description"/>
    <textarea className="field" rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description"/>
    <div className="agent-control-line">
      <label>Price INR <input className="field" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></label>
      <label>Status <select className="field" value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
    </div>
    <div className="actions"><button className="pill light" disabled={busy||!name.trim()} onClick={save}>{busy?'Saving…':'Save product →'}</button></div>
    {message?<p className="status-message">{message}</p>:null}
  </div>
}
