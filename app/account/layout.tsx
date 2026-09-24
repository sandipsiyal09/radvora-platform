import type { Metadata } from 'next'
import './account.css'
import './order-detail-continuity.css'

export const metadata:Metadata={title:'Account',robots:{index:false,follow:false,nocache:true}}

export default function AccountLayout({children}:{children:React.ReactNode}){
  return children
}
