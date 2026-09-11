import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic='force-dynamic'

const EXPECTED_RUNTIME_SCHEMA_VERSION='202609110048'
const requiredRuntimeConfig=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY']
function responseHeaders(){return {'Cache-Control':'no-store'}}

export async function GET(){
  const timestamp=new Date().toISOString()
  const configurationReady=requiredRuntimeConfig.every(key=>Boolean(process.env[key]?.trim()))
  const canonicalUrlReady=(()=>{try{return new URL(process.env.NEXT_PUBLIC_APP_URL||'').protocol==='https:'}catch{return false}})()
  const indiaPaymentsConfigured=Boolean(process.env.RAZORPAY_KEY_ID?.trim()&&process.env.RAZORPAY_KEY_SECRET?.trim()&&process.env.RAZORPAY_WEBHOOK_SECRET?.trim())

  if(!configurationReady){
    return NextResponse.json({service:'radvora-platform',status:'degraded',checks:{configuration:'unavailable',database:'not_checked',commerce_schema:'not_checked',payment_session_schema:'not_checked',seller_profile:'not_checked',runtime_schema_version:'not_checked',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'configured':'not_configured'},expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
  }

  try{
    const supabase=createAdminClient()
    const [{error:productError},{error:itemError},{error:paymentError},{data:sellerReady,error:sellerError},{data:schemaVersion,error:schemaVersionError}]=await Promise.all([
      supabase.from('products').select('id,commerce_enabled,hsn_code,gst_rate,price_inr_includes_gst,stock_on_hand,stock_reserved',{count:'exact',head:true}).limit(1),
      supabase.from('order_items').select('id,line_subtotal,tax_amount,hsn_code,gst_rate,price_includes_gst,inventory_reserved_quantity',{count:'exact',head:true}).limit(1),
      supabase.from('payment_attempts').select('id,provider_session_id,provider_session_url,provider_session_expires_at',{count:'exact',head:true}).limit(1),
      supabase.rpc('server_india_seller_profile_ready'),
      supabase.rpc('server_runtime_schema_version')
    ])
    if(productError||itemError||paymentError||sellerError||schemaVersionError) throw productError||itemError||paymentError||sellerError||schemaVersionError
    const runtimeSchemaVersion=String(schemaVersion||'')
    if(runtimeSchemaVersion!==EXPECTED_RUNTIME_SCHEMA_VERSION) throw new Error(`Runtime schema version mismatch: expected ${EXPECTED_RUNTIME_SCHEMA_VERSION}`)

    return NextResponse.json({service:'radvora-platform',status:'ok',checks:{configuration:'ok',database:'ok',commerce_schema:'ok',payment_session_schema:'ok',seller_profile:sellerReady===true?'configured':'not_configured',runtime_schema_version:'ok',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'configured':'not_configured'},runtimeSchemaVersion,expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:200,headers:responseHeaders()})
  }catch(error){
    console.error('health_check_failed',error)
    return NextResponse.json({service:'radvora-platform',status:'degraded',checks:{configuration:'ok',database:'unavailable_or_schema_mismatch',commerce_schema:'unavailable_or_outdated',payment_session_schema:'unavailable_or_outdated',seller_profile:'unavailable_or_outdated',runtime_schema_version:'mismatch_or_unavailable',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'configured':'not_configured'},expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
  }
}
