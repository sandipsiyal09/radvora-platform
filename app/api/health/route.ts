import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic='force-dynamic'
export const runtime='nodejs'
export const maxDuration=10

const EXPECTED_RUNTIME_SCHEMA_VERSION='202609140051'
const HEALTH_QUERY_TIMEOUT_MS=8000
const requiredRuntimeConfig=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
function responseHeaders(){return {'Cache-Control':'no-store, max-age=0','Pragma':'no-cache','Expires':'0','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}}
function releaseMetadata(){
  const vercelEnvironment=(process.env.VERCEL_ENV||'').trim()
  const environment=(vercelEnvironment||process.env.NODE_ENV||'unknown').trim()
  const commit=((environment==='production'?process.env.VERCEL_GIT_COMMIT_SHA:(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GIT_COMMIT_SHA))||'').trim()
  const ref=(process.env.VERCEL_GIT_COMMIT_REF||'').trim()
  return {commit:commit||'unknown',ref:ref||'unknown',environment}
}
function productionReleaseProvenanceReady(release:ReturnType<typeof releaseMetadata>){
  if(release.environment!=='production') return true
  const vercelCommit=(process.env.VERCEL_GIT_COMMIT_SHA||'').trim()
  const vercelRef=(process.env.VERCEL_GIT_COMMIT_REF||'').trim()
  return process.env.VERCEL_ENV==='production'&&/^[0-9a-f]{40}$/i.test(vercelCommit)&&vercelRef==='main'&&release.commit===vercelCommit&&release.ref===vercelRef
}
function canonicalProductionUrlReady(value:string|undefined,requestUrl:string){
  try{
    const url=new URL(value||'')
    const request=new URL(requestUrl)
    const hostname=url.hostname.toLowerCase()
    const isIpLiteral=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)||hostname.includes(':')
    const canonicalOriginReady=url.protocol==='https:'&&
      !url.username&&!url.password&&
      !isIpLiteral&&hostname!=='localhost'&&hostname.endsWith('.')===false&&hostname.includes('.')&&
      (url.pathname==='/'||url.pathname==='')&&!url.search&&!url.hash&&
      (url.port===''||url.port==='443')
    return canonicalOriginReady&&request.origin===url.origin&&request.pathname==='/api/health'
  }catch{return false}
}
async function withHealthTimeout<T>(operation:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  const controller=new AbortController()
  const timeout=setTimeout(()=>controller.abort(),HEALTH_QUERY_TIMEOUT_MS)
  try{
    return await operation(controller.signal)
  }finally{
    clearTimeout(timeout)
  }
}

export async function GET(request:Request){
  const timestamp=new Date().toISOString()
  const release=releaseMetadata()
  const canonicalUrlReady=canonicalProductionUrlReady(process.env.NEXT_PUBLIC_APP_URL,request.url)
  const releaseProvenanceReady=productionReleaseProvenanceReady(release)
  const missingRuntimeConfig=[
    ...requiredRuntimeConfig.filter(key=>!process.env[key]?.trim()),
    ...(release.environment==='production'&&!canonicalUrlReady?['NEXT_PUBLIC_APP_URL'] as const:[]),
  ]
  const configurationReady=missingRuntimeConfig.length===0
  const razorpayKeyId=(process.env.RAZORPAY_KEY_ID||'').trim()
  const razorpayLiveKeyReady=/^rzp_live_[A-Za-z0-9]+$/.test(razorpayKeyId)
  const indiaPaymentsConfigured=Boolean(razorpayLiveKeyReady&&process.env.RAZORPAY_KEY_SECRET?.trim()&&process.env.RAZORPAY_WEBHOOK_SECRET?.trim())

  if(!configurationReady){
    return NextResponse.json({service:'radvora-platform',status:'degraded',release,missingRuntimeConfig,checks:{configuration:'unavailable',release_provenance:releaseProvenanceReady?'verified':'unavailable',database:'not_checked',commerce_schema:'not_checked',commerce_activation:'not_checked',payment_session_schema:'not_checked',seller_profile:'not_checked',runtime_schema_version:'not_checked',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'live_configured':razorpayKeyId?'test_or_invalid_key':'not_configured'},expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
  }

  if(!releaseProvenanceReady){
    return NextResponse.json({service:'radvora-platform',status:'degraded',release,missingRuntimeConfig:[],checks:{configuration:'ok',release_provenance:'unavailable',database:'not_checked',commerce_schema:'not_checked',commerce_activation:'not_checked',payment_session_schema:'not_checked',seller_profile:'not_checked',runtime_schema_version:'not_checked',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'live_configured':razorpayKeyId?'test_or_invalid_key':'not_configured'},expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
  }

  try{
    const supabase=createAdminClient()
    const [{data:commerceEnabledProducts,count:commerceEnabledProductCount,error:productError},{error:itemError},{error:paymentError},{data:sellerReady,error:sellerError},{data:schemaVersion,error:schemaVersionError}]=await withHealthTimeout(signal=>Promise.all([
      supabase.from('products').select('id,status,price_inr,currency,commerce_enabled,hsn_code,gst_rate,price_inr_includes_gst,stock_on_hand,stock_reserved',{count:'exact'}).eq('commerce_enabled',true).limit(1000).abortSignal(signal),
      supabase.from('order_items').select('id,line_subtotal,tax_amount,hsn_code,gst_rate,price_includes_gst,inventory_reserved_quantity',{count:'exact',head:true}).limit(1).abortSignal(signal),
      supabase.from('payment_attempts').select('id,provider_session_id,provider_session_url,provider_session_expires_at',{count:'exact',head:true}).limit(1).abortSignal(signal),
      supabase.rpc('server_india_seller_profile_ready').abortSignal(signal),
      supabase.rpc('server_runtime_schema_version').abortSignal(signal)
    ]))
    if(productError||itemError||paymentError||sellerError||schemaVersionError) throw productError||itemError||paymentError||sellerError||schemaVersionError
    const runtimeSchemaVersion=String(schemaVersion||'')
    if(runtimeSchemaVersion!==EXPECTED_RUNTIME_SCHEMA_VERSION) throw new Error(`Runtime schema version mismatch: expected ${EXPECTED_RUNTIME_SCHEMA_VERSION}`)

    const commerceEnabledProductsCount=commerceEnabledProductCount||0
    const enabledCatalog=commerceEnabledProducts||[]
    const completeEnabledCatalog=commerceEnabledProductsCount===enabledCatalog.length&&enabledCatalog.every(product=>{
      const validHsn=Boolean(product.hsn_code&&/^\d{4,8}$/.test(String(product.hsn_code)))
      const validGst=product.gst_rate!==null&&Number(product.gst_rate)>=0&&Number(product.gst_rate)<=100&&product.price_inr_includes_gst!==null
      const availableStock=product.stock_on_hand===null?null:Number(product.stock_on_hand)-Number(product.stock_reserved||0)
      return product.status==='active'&&product.currency==='INR'&&Number(product.price_inr)>0&&validHsn&&validGst&&availableStock!==null&&availableStock>0
    })
    const commerceActivationSafe=commerceEnabledProductsCount===0||(sellerReady===true&&indiaPaymentsConfigured&&completeEnabledCatalog)
    if(!commerceActivationSafe){
      return NextResponse.json({service:'radvora-platform',status:'degraded',release,missingRuntimeConfig:[],checks:{configuration:'ok',release_provenance:'verified',database:'ok',commerce_schema:'ok',commerce_activation:'unsafe',payment_session_schema:'ok',seller_profile:sellerReady===true?'configured':'not_configured',runtime_schema_version:'ok',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'live_configured':razorpayKeyId?'test_or_invalid_key':'not_configured'},runtimeSchemaVersion,expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
    }

    return NextResponse.json({service:'radvora-platform',status:'ok',release,missingRuntimeConfig:[],checks:{configuration:'ok',release_provenance:'verified',database:'ok',commerce_schema:'ok',commerce_activation:commerceEnabledProductsCount===0?'disabled':'ready',payment_session_schema:'ok',seller_profile:sellerReady===true?'configured':'not_configured',runtime_schema_version:'ok',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'live_configured':razorpayKeyId?'test_or_invalid_key':'not_configured'},runtimeSchemaVersion,expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:200,headers:responseHeaders()})
  }catch{
    console.error('health_check_failed',{release,component:'database_or_schema'})
    return NextResponse.json({service:'radvora-platform',status:'degraded',release,missingRuntimeConfig:[],checks:{configuration:'ok',release_provenance:'verified',database:'unavailable_or_schema_mismatch',commerce_schema:'unavailable_or_outdated',commerce_activation:'not_checked',payment_session_schema:'unavailable_or_outdated',seller_profile:'unavailable_or_outdated',runtime_schema_version:'mismatch_or_unavailable',canonical_url:canonicalUrlReady?'configured':'not_configured',india_payments:indiaPaymentsConfigured?'live_configured':razorpayKeyId?'test_or_invalid_key':'not_configured'},expectedRuntimeSchemaVersion:EXPECTED_RUNTIME_SCHEMA_VERSION,timestamp},{status:503,headers:responseHeaders()})
  }
}

function methodNotAllowed(){
  return NextResponse.json(
    {service:'radvora-platform',status:'method_not_allowed'},
    {status:405,headers:{...responseHeaders(),Allow:'GET, HEAD'}},
  )
}

export const POST=methodNotAllowed
export const PUT=methodNotAllowed
export const PATCH=methodNotAllowed
export const DELETE=methodNotAllowed
export const OPTIONS=methodNotAllowed
