import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export const runtime='nodejs'

const MAX_BODY_BYTES=2048
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body:Record<string,unknown>,status=200){
  return NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0'}})
}

function canonicalOrigin(request:Request){
  const configured=process.env.NEXT_PUBLIC_APP_URL?.trim()
  if(configured){
    try{return new URL(configured).origin}catch{return null}
  }
  try{return new URL(request.url).origin}catch{return null}
}

function invalidOrigin(request:Request,expected:string){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site')return true
  const origin=request.headers.get('origin')
  if(!origin)return false
  try{return new URL(origin).origin!==expected}catch{return true}
}

export async function POST(request:Request){
  const expectedOrigin=canonicalOrigin(request)
  if(!expectedOrigin)return json({error:'Authentication is temporarily unavailable.'},503)
  if(invalidOrigin(request,expectedOrigin))return json({error:'Invalid authentication request origin.'},403)

  const length=request.headers.get('content-length')
  if(length&&Number(length)>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Invalid request.'},415)

  const raw=await request.text()
  if(Buffer.byteLength(raw,'utf8')>MAX_BODY_BYTES)return json({error:'Request is too large.'},413)

  let body:unknown
  try{body=JSON.parse(raw||'{}')}catch{return json({error:'Invalid request.'},400)}
  const email=typeof body==='object'&&body!==null&&'email' in body?String((body as {email?:unknown}).email||'').trim().toLowerCase():''
  if(!email||email.length>254||!EMAIL.test(email))return json({error:'Enter a valid email address.'},400)

  const supabase=await createClient()
  const callbackUrl=`${expectedOrigin}/auth/callback?next=/account`
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callbackUrl}})
  if(error){
    console.error('passwordless_login_request_failed',{message:error.message})
    return json({error:'Unable to send the sign-in link right now. Please try again shortly.'},503)
  }

  return json({ok:true,message:'Check your email for the secure sign-in link.'},202)
}
