import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '../../../../lib/supabase/server'

export const runtime='nodejs'

export async function POST(request:Request){
  const secret=process.env.STRIPE_SECRET_KEY
  if(!secret) return NextResponse.json({error:'Stripe is not configured.'},{status:503})

  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Authentication required.'},{status:401})

  const {data:orderData,error:orderError}=await supabase.rpc('checkout_active_cart')
  if(orderError) return NextResponse.json({error:orderError.message},{status:400})
  const order=Array.isArray(orderData)?orderData[0]:orderData
  if(!order?.id) return NextResponse.json({error:'Unable to create order.'},{status:400})

  const {data:items,error:itemsError}=await supabase
    .from('order_items')
    .select('quantity,unit_price,line_total,product_id,products(name)')
    .eq('order_id',order.id)
  if(itemsError||!items?.length) return NextResponse.json({error:itemsError?.message||'Order has no items.'},{status:400})

  const stripe=new Stripe(secret)
  const origin=new URL(request.url).origin
  const session=await stripe.checkout.sessions.create({
    mode:'payment',
    customer_email:user.email||undefined,
    client_reference_id:order.id,
    metadata:{order_id:order.id,order_number:order.order_number,user_id:user.id},
    line_items:items.map((item:any)=>({
      quantity:item.quantity,
      price_data:{
        currency:'inr',
        unit_amount:Math.round(Number(item.unit_price)*100),
        product_data:{name:item.products?.name||'RADVORA Product'}
      }
    })),
    success_url:`${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${origin}/cart?payment=cancelled`
  })

  await supabase.from('payment_attempts').insert({
    order_id:order.id,
    user_id:user.id,
    provider:'stripe',
    provider_reference:session.id,
    status:'created',
    amount:order.total,
    currency:order.currency||'INR'
  })

  return NextResponse.json({url:session.url})
}
