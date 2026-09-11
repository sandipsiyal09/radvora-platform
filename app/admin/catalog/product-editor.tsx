'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

type Props={product:{id:string;name:string;short_description:string|null;description:string|null;price_inr:number|null;status:string;currency:string;commerce_enabled:boolean}}

export default function ProductEditor({product}:Props){
  const router=useRouter()
  const [name,setName]=useState(product.name)
  const [shortDescription,setShortDescription]=useState(product.short_description||'')
  const [description,setDescription]=useState(product.description||'')
  const [price,setPrice]=useState(product.price_inr?.toString()||'')
  const [status,setStatus]=useState(product.status)
  const [busy,setBusy]=useState(false)
  const [commerceBusy,setCommerceBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function save(){
    const parsedPrice=price===''?null:Number(price)
    if(!name.trim()||name.trim().length>200||shortDescription.length>500||description.length>5000||parsedPrice!==null&&(!Number.isFinite(parsedPrice)||parsedPrice<0)){
      setMessage('Check the product name, descriptions and INR price before saving.')
      return
    }
    setBusy(true);setMessage('')
    try{
      const supabase=createClient()
      const {error}=await supabase.rpc('update_product_catalog',{
        p_product_id:product.id,
        p_name:name,
        p_short_description:shortDescription,
        p_description:description,
        p_price_inr:parsedPrice,
        p_status:status
      })
      if(error){console.error('catalog_update_failed',error);setMessage('Unable to save the catalog record.');return}
      setMessage('Catalog record saved.')
      router.refresh()
    }catch(error){console.error('catalog_update_failed',error);setMessage('Unable to save the catalog record.')}
    finally{setBusy(false)}
  }

  async function toggleCommerce(){
    setCommerceBusy(true);setMessage('')
    try{
      const supabase=createClient()
      const {error}=await supabase.rpc('set_product_commerce_enabled',{p_product_id:product.id,p_enabled:!product.commerce_enabled})
      if(error){console.error('commerce_toggle_failed',error);setMessage(product.commerce_enabled?'Unable to disable commerce.':'Commerce can be enabled only for an active product with a positive INR price.');return}
      setMessage(product.commerce_enabled?'India commerce disabled.':'India commerce enabled.')
      router.refresh()
    }catch(error){console.error('commerce_toggle_failed',error);setMessage('Unable to update commerce availability.')}
    finally{setCommerceBusy(false)}
  }

  return <div className="catalog-editor">
    <input className="field" value={name} maxLength={200} onChange={e=>setName(e.target.value)} placeholder="Product name"/>
    <input className="field" value={shortDescription} maxLength={500} onChange={e=>setShortDescription(e.target.value)} placeholder="Short description"/>
    <textarea className="field" rows={5} value={description} maxLength={5000} onChange={e=>setDescription(e.target.value)} placeholder="Description"/>
    <div className="agent-control-line">
      <label>Price INR <input className="field" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></label>
      <label>Status <select className="field" value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
    </div>
    <p className="empty-state">Commerce: <strong>{product.commerce_enabled?'ENABLED':'DISABLED'}</strong> · Currency: {product.currency}. Saving a draft, archived, zero-price or unpriced product automatically disables commerce.</p>
    <div className="actions"><button className="pill light" disabled={busy||!name.trim()} onClick={save}>{busy?'Saving…':'Save product →'}</button><button className="pill ghost" disabled={commerceBusy||busy} onClick={toggleCommerce}>{commerceBusy?'Updating…':product.commerce_enabled?'Disable India commerce':'Enable India commerce'}</button></div>
    {message?<p className="status-message" role="status">{message}</p>:null}
  </div>
}
