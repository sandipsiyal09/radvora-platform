import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const runtime='nodejs'

type CheckoutBody={orderId?:string}

export async function POST(request:Request){
  const secret=process.env.STRIPE_SECRET_KEY
  if(!secret) return NextResponse.json({error:'Stripe is not configured.'},{status:503})

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Authentication required.'},{status:401})

  let body:CheckoutBody={}
  try{body=await request.json()}catch{/* cart checkout has no body */}

  let order:any
  if(body.orderId){
    const {data,error}=await supabase.from('orders').select('id,order_number,total,currency,status').eq('id',body.orderId).eq('user_id',user.id).maybeSingle()
    if(error||!data) return NextResponse.json({error:'Order not found.'},{status:404})
    if(data.status!=='pending') return NextResponse.json({error:'Only pending orders can be retried.'},{status:409})
    const {data:paidAttempt}=await supabase.from('payment_attempts').select('id').eq('order_id',data.id).in('status',['authorized','captured']).limit(1).maybeSingle()
    if(paidAttempt) return NextResponse.json({error:'A successful payment already exists for this order.'},{status:409})
    order=data
  }else{
    const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart')
    if(orderError) return NextResponse.json({error:orderError.message},{status:400})
    order=Array.isArray(orderData)?orderData[0]:orderData
    if(!order?.id) return NextResponse.json({error:'Unable to create order.'},{status:400})
  }

  const {data:items,error:itemsError}=await supabase
    .from('order_items')
    .select('quantity,unit_price,line_total,product_id,products(name)')
    .eq('order_id',order.id)
  if(itemsError||!items?.length) return NextResponse.json({error:itemsError?.message||'Order has no items.'},{status:400})

  const currency=String(order.currency||'INR').trim().toLowerCase()
  if(!/^[a-z]{3}$/.test(currency)) return NextResponse.json({error:'Order currency is invalid.'},{status:400})

  const admin=createAdminClient()
  const {data:attempt,error:attemptError}=await admin.from('payment_attempts').insert({
    order_id:order.id,
    provider:'stripe',
    status:'created',
    amount:order.total,
    currency:currency.toUpperCase()
  }).select('id').single()
  if(attemptError||!attempt) return NextResponse.json({error:'Unable to initialize payment tracking.'},{status:500})

  try{
    const stripe=new Stripe(secret)
    const origin=new URL(request.url).origin
    const session=await stripe.checkout.sessions.create({
      mode:'payment',
      customer_email:user.email||undefined,
      client_reference_id:order.id,
      metadata:{order_id:order.id,order_number:order.order_number,user_id:user.id,payment_attempt_id:attempt.id},
      shipping_address_collection:{allowed_countries:['IN']},
      phone_number_collection:{enabled:true},
      line_items:items.map((item:any)=>({
        quantity:item.quantity,
        price_data:{
          currency,
          unit_amount:Math.round(Number(item.unit_price)*100),
          product_data:{name:item.products?.name||'RADVORA Product'}
        }
      })),
      success_url:`${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/account/orders/${order.id}`
    })

    const {error:linkError}=await admin.from('payment_attempts').update({provider_order_id:session.id,status:'pending',updated_at:new Date().toISOString()}).eq('id',attempt.id)
    if(linkError){
      return NextResponse.json({error:'Payment session could not be finalized safely. Please retry from the order page.',orderId:order.id,retryable:true},{status:500})
    }

    return NextResponse.json({url:session.url,orderId:order.id})
  }catch(error){
    await admin.from('payment_attempts').update({status:'failed',failure_code:'stripe_session_error',updated_at:new Date().toISOString()}).eq('id',attempt.id)
    const message=error instanceof Error?error.message:'Unable to start secure checkout.'
    return NextResponse.json({error:message,orderId:order.id,retryable:true},{status:502})
  }
}
