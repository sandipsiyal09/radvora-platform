import type { Metadata } from 'next'
import './checkout-cinematic.css'

export const metadata:Metadata={robots:{index:false,follow:false,nocache:true}}

export default function CheckoutLayout({children}:{children:React.ReactNode}){
  return children
}
