'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function CartItemControls({itemId,quantity}:{itemId:string;quantity:number}){
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function setQuantity(next:number){
    if(busy||next<0||next>50) return
    setBusy(true);setMessage('')
    try{
      const supabase=createClient()
      const {error}=await supabase.rpc('set_cart_item_quantity',{p_item_id:itemId,p_quantity:next})
      if(error){setMessage('Unable to update cart.');return}
      router.refresh()
    }catch{setMessage('Unable to update cart.')}
    finally{setBusy(false)}
  }

  return <div className="cart-controls"><button type="button" className="pill ghost" onClick={()=>setQuantity(quantity-1)} disabled={busy||quantity<=1}>−</button><span>{quantity}</span><button type="button" className="pill ghost" onClick={()=>setQuantity(quantity+1)} disabled={busy||quantity>=50}>+</button><button type="button" className="pill ghost" onClick={()=>setQuantity(0)} disabled={busy}>Remove</button>{message?<small role="status">{message}</small>:null}</div>
}
