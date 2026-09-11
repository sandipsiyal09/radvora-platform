'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function AddToCartButton({productId}:{productId:string}){
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function add(){
    if(busy) return
    setBusy(true)
    setMessage('')
    try{
      const supabase=createClient()
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){window.location.assign('/login');return}
      const {error}=await supabase.rpc('add_product_to_cart',{p_product_id:productId,p_quantity:1})
      if(error){setMessage('Unable to add this product to your cart right now.');return}
      setMessage('Added to cart.')
    }catch{
      setMessage('Unable to add this product to your cart right now.')
    }finally{
      setBusy(false)
    }
  }

  return <div><button className="pill light" type="button" onClick={add} disabled={busy}>{busy?'Adding…':'Add to cart →'}</button>{message?<p className="status-message" role="status">{message} {message==='Added to cart.'?<a href="/cart">View cart</a>:null}</p>:null}</div>
}
