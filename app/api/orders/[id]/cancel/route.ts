import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

export const runtime='nodejs'

type Params={params:Promise<{id:string}>}

function json(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})}

function invalidOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')?.toLowerCase()==='cross-site') return true
  const origin=request.headers.get('origin')
  if(!origin) return false
  try{
    const supplied=new URL(origin).origin
    const requestOrigin=new URL(request.url).origin
    const configured=process.env.NEXT_PUBLIC_APP_URL?new URL(process.env.NEXT_PUBLIC_APP_URL).origin:requestOrigin
    return supplied!==requestOrigin&&supplied!==configured
  }catch{return true}
}

export async function POST(request:Request,{params}:Params){
  if(invalidOrigin(request)) return json({error:'Invalid cancellation request origin.'},403)

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return json({error:'Authentication required.'},401)

  const {id:orderId}=await params
  const admin=createAdminClient()
  const {data,error}=await admin.rpc('cancel_pending_order',{p_order_id:orderId,p_user_id:user.id})
  if(error){
    const message=String(error.message||'')
    if(message.includes('not found')) return json({error:'Order not found.'},404)
    if(message.includes('not pending')||message.includes('active or completed payment state')) return json({error:'This order cannot be cancelled while a payment session is active or after payment state has progressed.'},409)
    console.error('pending_order_cancel_failed',error)
    return json({error:'Unable to cancel the order safely.'},500)
  }

  return json({ok:true,orderId:data?.id||orderId,status:'cancelled'})
}
