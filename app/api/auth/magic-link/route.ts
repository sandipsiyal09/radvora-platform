import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export const runtime='nodejs'
export const maxDuration=10

const MAX_BODY_BYTES=2048
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body:Record<string,unknown>,status=200){
  return NextResponse.json(body,{status,headers:{
    'Cache-Control':'private, no-store, max-age=0',
    'Pragma':'no-cache',
    'Expires':'0',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Cross-Origin-Resource-Policy':'same-origin',
    'X-Robots-Tag':'noindex, nofollow, noarchive',
  }})
}

function isProductionRuntime(){return process.env.VERCEL_ENV==='production'||(process.env.NODE_ENV==='production'&&!process.env.VERCEL_ENV)}
function isSafeProductionOrigin(url:URL){
  const hostname=url.hostname.toLowerCase()
  const isIpLiteral=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)||hostname.includes(':')
  return url.protocol==='https:'&&!url.username&&!url.password&&!isIpLiteral&&hostname!=='localhost'&&!hostname.endsWith('.')&&hostname.includes('.')&&(url.pathname==='/'||url.pathname==='')&&!url.search&&!url.hash&&(url.port===''||url.port==='443')
}
function canonicalOrigin(request:Request){
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim()
  if(configured){
    try{
      const url=new URL(configured)
      if(isProductionRuntime())return isSafeProductionOrigin(url)?url.origin:null
      const safeNonProductionOrigin=url.protocol==='https:'||url.hostname==='localhost'
      if(safeNonProductionOrigin)return url.origin
    }catch{
      // Production sign-in requests must fail closed below rather than trusting request.url.
    }
  }
  if(isProductionRuntime())return null
  try{
    const url=new URL(request.url)
    return url.protocol==='https:'||url.hostname==='localhost'?url.origin:null
  }catch{return null}
}

function invalidOrigin(request:Request,canonical:string){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin')
  if(!origin)return true
  try{
    const supplied=new URL(origin).origin
    if(isProductionRuntime())return supplied!==canonical
    const requestOrigin=new URL(request.url).origin
    return supplied!==canonical&&supplied!==requestOrigin
  }catch{return true}
}

export async function POST(request:Request){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin)return json({error:'Authentication is temporarily unavailable.'},503)
  if(invalidOrigin(request,expectedOrigin))return json({error:'Invalid authentication request origin.'},403)

  const length=request.headers.get('content-length')
  if(length){
    const declaredLength=Number(length)
    if(!Number.isFinite(declaredLength)||declaredLength<0)return json({error:'Invalid request.'},400)
    if(declaredLength>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  }
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Invalid request.'},415)

  let raw:string
  try{raw=await request.text()}catch{return json({error:'Invalid request.'},400)}
  if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)

  let parsedBody:unknown
  try{parsedBody=JSON.parse(raw||'{}')}catch{return json({error:'Invalid request.'},400)}
  if(!parsedBody||typeof parsedBody!=='object'||Array.isArray(parsedBody))return json({error:'Invalid request.'},400)
  const body=parsedBody as Record<string,unknown>
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():''
  if(!email||email.length>254||!EMAIL.test(email))return json({error:'Enter a valid email address.'},400)

  const supabase=await createClient()
  const callbackUrl=`${expectedOrigin}/auth/callback?next=/account`
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callbackUrl}})
  if(error){
    const errorName=error instanceof Error?error.name:'auth_error'
    const errorStatus='status' in error&&typeof error.status==='number'?error.status:null
    const errorCode='code' in error&&typeof error.code==='string'?error.code:null
    console.error('passwordless_login_request_failed',{component:'auth_magic_link',errorName,errorStatus,errorCode})
    if(errorStatus===429)return json({error:'Too many sign-in attempts. Please wait a few minutes and try again.'},429)
    return json({error:'Unable to send the sign-in link right now. Please try again shortly.'},503)
  }

  return json({ok:true,message:'Check your email for the secure sign-in link.'},202)
}
