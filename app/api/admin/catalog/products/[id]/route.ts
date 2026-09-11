import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../../lib/supabase/admin'

export const runtime='nodejs'
const MAX_BODY_BYTES=8192
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Params={params:Promise<{id:string}>}
type Body={action?:'catalog'|'tax'|'inventory'|'commerce';name?:string;shortDescription?:string;description?:string;priceInr?:number|null;status?:string;hsnCode?:string;gstRate?:number;priceIncludesGst?:boolean;stockOnHand?:number;enabled?:boolean}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}
function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return true
  const origin=request.headers.get('origin');if(!origin)return false
  try{const supplied=new URL(origin).origin;const requestOrigin=new URL(request.url).origin;const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin;return supplied!==requestOrigin&&supplied!==configured}catch{return true}
}

export async function POST(request:Request,{params}:Params){
  if(invalidOrigin(request)) return json({error:'Invalid catalog control origin.'},403)
  const {id}=await params
  if(!UUID.test(id)) return json({error:'Invalid product identifier.'},400)
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)
  const role=String(user.app_metadata?.role||'')
  if(role!=='admin'&&role!=='founder') return json({error:'Admin access required.'},403)
  let raw='';try{raw=await request.text()}catch{return json({error:'Invalid request.'},400)}
  if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES) return json({error:'Request is too large.'},413)
  let body:Body;try{body=JSON.parse(raw||'{}') as Body}catch{return json({error:'Invalid request.'},400)}
  const admin=createAdminClient()

  if(body.action==='catalog'){
    const name=typeof body.name==='string'?body.name.trim():'';const shortDescription=typeof body.shortDescription==='string'?body.shortDescription:'';const description=typeof body.description==='string'?body.description:'';const status=typeof body.status==='string'?body.status:'';const priceInr=body.priceInr===null?null:typeof body.priceInr==='number'?body.priceInr:NaN
    if(!name||name.length>200||shortDescription.length>500||description.length>5000||!['draft','active','archived'].includes(status)||priceInr!==null&&(!Number.isFinite(priceInr)||priceInr<0)) return json({error:'Invalid catalog values.'},400)
    const {error}=await admin.rpc('server_update_product_catalog',{p_actor_id:user.id,p_actor_role:role,p_product_id:id,p_name:name,p_short_description:shortDescription,p_description:description,p_price_inr:priceInr,p_status:status})
    if(error){console.error('server_catalog_update_failed',error);return json({error:'Unable to save the catalog record.'},409)}
    return json({ok:true,status:'saved'})
  }

  if(body.action==='tax'){
    const hsnCode=typeof body.hsnCode==='string'?body.hsnCode.trim():'';const gstRate=typeof body.gstRate==='number'?body.gstRate:NaN
    if(!/^[0-9]{4,8}$/.test(hsnCode)||!Number.isFinite(gstRate)||gstRate<0||gstRate>100||typeof body.priceIncludesGst!=='boolean') return json({error:'Invalid India tax configuration.'},400)
    const {error}=await admin.rpc('server_set_product_india_tax_config',{p_actor_id:user.id,p_actor_role:role,p_product_id:id,p_hsn_code:hsnCode,p_gst_rate:gstRate,p_price_includes_gst:body.priceIncludesGst})
    if(error){console.error('server_product_tax_config_failed',error);return json({error:'Unable to save the India tax configuration.'},409)}
    return json({ok:true,status:'tax_saved'})
  }

  if(body.action==='inventory'){
    const stock=typeof body.stockOnHand==='number'?body.stockOnHand:NaN
    if(!Number.isSafeInteger(stock)||stock<0||stock>100000000) return json({error:'Invalid stock quantity.'},400)
    const {error}=await admin.rpc('server_set_product_inventory',{p_actor_id:user.id,p_actor_role:role,p_product_id:id,p_stock_on_hand:stock})
    if(error){console.error('server_product_inventory_failed',error);return json({error:'Unable to save stock. Stock on hand cannot be below already reserved inventory.'},409)}
    return json({ok:true,status:'inventory_saved'})
  }

  if(body.action==='commerce'&&typeof body.enabled==='boolean'){
    const {error}=await admin.rpc('server_set_product_commerce_enabled',{p_actor_id:user.id,p_actor_role:role,p_product_id:id,p_enabled:body.enabled})
    if(error){console.error('server_product_commerce_toggle_failed',error);return json({error:body.enabled?'Product is not ready for India commerce. Confirm active status, positive INR pricing, GST/HSN configuration and available governed stock.':'Unable to disable India commerce.'},409)}
    return json({ok:true,status:body.enabled?'enabled':'disabled'})
  }
  return json({error:'Invalid catalog action.'},400)
}
