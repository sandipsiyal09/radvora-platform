'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function CheckoutButton({disabled=false}:{disabled?:boolean}){
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')

  async function checkout(){
    setLoading(true);setMessage('')
    const supabase=createClient()
    const { data,error }=await supabase.rpc('checkout_active_cart')
    if(error){setMessage(error.message)}
    else{
      const row=Array.isArray(data)?data[0]:data
      setMessage(row?.order_number?`Order ${row.order_number} created. Payment has not been captured yet.`:'Order created.')
    }
    setLoading(false)
  }

  return <div><button className="pill light" type="button" onClick={checkout} disabled={disabled||loading}>{loading?'Creating order…':'Create secure order →'}</button>{message?<p className="status-message">{message}</p>:null}</div>
}
