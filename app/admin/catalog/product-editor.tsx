'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props={product:{id:string;name:string;short_description:string|null;description:string|null;price_inr:number|null;status:string;currency:string;commerce_enabled:boolean;hsn_code:string|null;gst_rate:number|null;price_inr_includes_gst:boolean|null;stock_on_hand:number|null;stock_reserved:number}}
type ApiResponse={error?:string}

async function postCatalogAction(productId:string,body:Record<string,unknown>){
  const response=await fetch(`/api/admin/catalog/products/${productId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  let payload:ApiResponse={};try{payload=await response.json() as ApiResponse}catch{}
  if(!response.ok) throw new Error(payload.error||'Catalog action failed.')
}

export default function ProductEditor({product}:Props){
  const router=useRouter()
  const [name,setName]=useState(product.name);const [shortDescription,setShortDescription]=useState(product.short_description||'');const [description,setDescription]=useState(product.description||'');const [price,setPrice]=useState(product.price_inr?.toString()||'');const [status,setStatus]=useState(product.status)
  const [hsnCode,setHsnCode]=useState(product.hsn_code||'');const [gstRate,setGstRate]=useState(product.gst_rate?.toString()||'');const [priceIncludesGst,setPriceIncludesGst]=useState(product.price_inr_includes_gst===true?'yes':product.price_inr_includes_gst===false?'no':'')
  const [stockOnHand,setStockOnHand]=useState(product.stock_on_hand?.toString()||'')
  const [busy,setBusy]=useState(false);const [taxBusy,setTaxBusy]=useState(false);const [inventoryBusy,setInventoryBusy]=useState(false);const [commerceBusy,setCommerceBusy]=useState(false);const [message,setMessage]=useState('')

  async function save(){
    const parsedPrice=price===''?null:Number(price)
    if(!name.trim()||name.trim().length>200||shortDescription.length>500||description.length>5000||parsedPrice!==null&&(!Number.isFinite(parsedPrice)||parsedPrice<0)){setMessage('Check the product name, descriptions and INR price before saving.');return}
    setBusy(true);setMessage('')
    try{await postCatalogAction(product.id,{action:'catalog',name,shortDescription,description,priceInr:parsedPrice,status});setMessage('Catalog record saved. Commerce was disabled pending review.');router.refresh()}catch(error){console.error('catalog_update_failed',error);setMessage(error instanceof Error?error.message:'Unable to save the catalog record.')}finally{setBusy(false)}
  }

  async function saveIndiaTaxConfig(){
    const normalizedHsn=hsnCode.trim();const parsedGst=gstRate===''?null:Number(gstRate);const includesGst=priceIncludesGst==='yes'?true:priceIncludesGst==='no'?false:null
    if(!/^[0-9]{4,8}$/.test(normalizedHsn)||parsedGst===null||!Number.isFinite(parsedGst)||parsedGst<0||parsedGst>100||includesGst===null){setMessage('Enter a 4–8 digit HSN code, GST rate from 0–100, and explicitly confirm whether the displayed INR price includes GST.');return}
    setTaxBusy(true);setMessage('')
    try{await postCatalogAction(product.id,{action:'tax',hsnCode:normalizedHsn,gstRate:parsedGst,priceIncludesGst:includesGst});setMessage('India GST/HSN configuration saved. Commerce was disabled pending review.');router.refresh()}catch(error){console.error('product_tax_config_failed',error);setMessage(error instanceof Error?error.message:'Unable to save the India tax configuration.')}finally{setTaxBusy(false)}
  }

  async function saveInventory(){
    const stock=Number(stockOnHand)
    if(stockOnHand.trim()===''||!Number.isSafeInteger(stock)||stock<0){setMessage('Enter stock on hand as a whole number of zero or greater.');return}
    setInventoryBusy(true);setMessage('')
    try{await postCatalogAction(product.id,{action:'inventory',stockOnHand:stock});setMessage('Governed stock saved. Commerce was disabled pending review.');router.refresh()}catch(error){console.error('product_inventory_failed',error);setMessage(error instanceof Error?error.message:'Unable to save governed stock.')}finally{setInventoryBusy(false)}
  }

  async function toggleCommerce(){
    setCommerceBusy(true);setMessage('')
    try{await postCatalogAction(product.id,{action:'commerce',enabled:!product.commerce_enabled});setMessage(product.commerce_enabled?'India commerce disabled.':'India commerce enabled.');router.refresh()}catch(error){console.error('commerce_toggle_failed',error);setMessage(error instanceof Error?error.message:'Unable to update commerce availability.')}finally{setCommerceBusy(false)}
  }

  const taxReady=Boolean(product.hsn_code&&product.gst_rate!==null&&product.price_inr_includes_gst!==null)
  const availableStock=product.stock_on_hand===null?null:Math.max(0,product.stock_on_hand-product.stock_reserved)
  const anyBusy=busy||taxBusy||inventoryBusy||commerceBusy

  return <div className="catalog-editor">
    <input className="field" value={name} maxLength={200} onChange={e=>setName(e.target.value)} placeholder="Product name"/>
    <input className="field" value={shortDescription} maxLength={500} onChange={e=>setShortDescription(e.target.value)} placeholder="Short description"/>
    <textarea className="field" rows={5} value={description} maxLength={5000} onChange={e=>setDescription(e.target.value)} placeholder="Description"/>
    <div className="agent-control-line"><label>Price INR <input className="field" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></label><label>Status <select className="field" value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label></div>
    <div className="agent-control-line"><label>HSN code <input className="field" inputMode="numeric" maxLength={8} value={hsnCode} onChange={e=>setHsnCode(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="4–8 digits"/></label><label>GST rate % <input className="field" inputMode="decimal" value={gstRate} onChange={e=>setGstRate(e.target.value)} placeholder="Approved rate"/></label><label>Price includes GST <select className="field" value={priceIncludesGst} onChange={e=>setPriceIncludesGst(e.target.value)}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
    <div className="agent-control-line"><label>Stock on hand <input className="field" inputMode="numeric" value={stockOnHand} onChange={e=>setStockOnHand(e.target.value.replace(/\D/g,''))} placeholder="Approved physical stock"/></label><div><strong>Reserved:</strong> {product.stock_reserved}<br/><strong>Available:</strong> {availableStock===null?'not configured':availableStock}</div></div>
    <p className="empty-state">India tax readiness: <strong>{taxReady?'CONFIGURED':'INCOMPLETE'}</strong> · Inventory: <strong>{availableStock!==null&&availableStock>0?'AVAILABLE':'BLOCKED'}</strong> · Commerce: <strong>{product.commerce_enabled?'ENABLED':'DISABLED'}</strong> · Currency: {product.currency}. Any catalog, GST/HSN or inventory change disables commerce until reviewed.</p>
    <div className="actions"><button className="pill light" disabled={anyBusy||!name.trim()} onClick={save}>{busy?'Saving…':'Save product →'}</button><button className="pill ghost" disabled={anyBusy} onClick={saveIndiaTaxConfig}>{taxBusy?'Saving tax…':'Save GST/HSN →'}</button><button className="pill ghost" disabled={anyBusy} onClick={saveInventory}>{inventoryBusy?'Saving stock…':'Save stock →'}</button><button className="pill ghost" disabled={anyBusy} onClick={toggleCommerce}>{commerceBusy?'Updating…':product.commerce_enabled?'Disable India commerce':'Enable India commerce'}</button></div>
    {message?<p className="status-message" role="status">{message}</p>:null}
  </div>
}
