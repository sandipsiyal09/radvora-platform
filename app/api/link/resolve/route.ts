import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'

const MAX_REDIRECTS=5
const TIMEOUT_MS=6500
const PRIVATE_HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff'}

function blockedIp(ip:string):boolean{
  const v=isIP(ip)
  if(v===4){
    const p=ip.split('.').map(Number),[a,b,c]=p
    return a===0||a===10||a===127||a>=224||
      (a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||
      (a===100&&b>=64&&b<=127)||(a===192&&b===0)||(a===192&&b===2)||
      (a===198&&(b===18||b===19))||(a===198&&b===51&&c===100)||(a===203&&b===0&&c===113)
  }
  if(v===6){
    const x=ip.toLowerCase()
    if(x==='::'||x==='::1'||x.startsWith('fe80:')||x.startsWith('fc')||x.startsWith('fd')||x.startsWith('ff'))return true
    if(x.startsWith('::ffff:')){
      const mapped=x.slice(7)
      return isIP(mapped)===4?blockedIp(mapped):true
    }
    return x.startsWith('2001:db8:')
  }
  return true
}

async function assertSafe(url:URL){
  if(!['http:','https:'].includes(url.protocol))throw new Error('UNSUPPORTED_PROTOCOL')
  if(url.username||url.password)throw new Error('EMBEDDED_CREDENTIALS')
  const host=url.hostname.toLowerCase().replace(/\.$/,'')
  if(host==='localhost'||host.endsWith('.localhost')||host==='metadata.google.internal')throw new Error('RESTRICTED_HOST')
  if(isIP(host)){if(blockedIp(host))throw new Error('RESTRICTED_HOST');return}
  const addresses=await dns.lookup(host,{all:true,verbatim:true})
  if(!addresses.length||addresses.some(x=>blockedIp(x.address)))throw new Error('RESTRICTED_HOST')
}

async function request(url:URL,method:'HEAD'|'GET'){
  await assertSafe(url)
  return fetch(url,{method,redirect:'manual',signal:AbortSignal.timeout(TIMEOUT_MS),headers:{'user-agent':'RADVORA-LinkResolver/1.0','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1'}})
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json().catch(()=>null) as {url?:unknown}|null
    if(typeof body?.url!=='string')return NextResponse.json({ok:false,error:{code:'INVALID_URL',message:'Enter a valid URL.'}},{status:400,headers:PRIVATE_HEADERS})
    const input=body.url.trim()
    if(!input||input.length>2048||/[\u0000-\u001f\u007f]/.test(input))return NextResponse.json({ok:false,error:{code:'INVALID_URL',message:'Enter a valid URL.'}},{status:400,headers:PRIVATE_HEADERS})
    let current=new URL(input)
    const seen=new Set<string>()
    const redirects:string[]=[]
    for(let i=0;i<=MAX_REDIRECTS;i++){
      await assertSafe(current)
      if(seen.has(current.href))throw new Error('REDIRECT_LOOP')
      seen.add(current.href)
      let res=await request(current,'HEAD')
      if(res.status===405||res.status===501)res=await request(current,'GET')
      if(res.status>=300&&res.status<400){
        const location=res.headers.get('location')
        if(!location)throw new Error('INVALID_REDIRECT')
        if(i===MAX_REDIRECTS)throw new Error('TOO_MANY_REDIRECTS')
        const next=new URL(location,current)
        await assertSafe(next)
        redirects.push(next.href); current=next; continue
      }
      if(!res.ok)throw new Error('UPSTREAM_ERROR')
      return NextResponse.json({ok:true,url:current.href,redirects,status:res.status,contentType:res.headers.get('content-type')},{headers:PRIVATE_HEADERS})
    }
    throw new Error('TOO_MANY_REDIRECTS')
  }catch(error){
    const code=error instanceof Error?error.message:'RESOLUTION_FAILED'
    const status=['INVALID_URL','UNSUPPORTED_PROTOCOL','EMBEDDED_CREDENTIALS','RESTRICTED_HOST'].includes(code)?400:422
    return NextResponse.json({ok:false,error:{code,message:'This link could not be safely resolved.'}},{status,headers:PRIVATE_HEADERS})
  }
}
