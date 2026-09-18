import type { Metadata } from 'next'

export const metadata:Metadata={
  title:'Verify a RADVORA Product',
  description:'Verify a RADVORA product serial record and review its published product identity status.',
  alternates:{canonical:'/verify'}
}

export default function VerifyLayout({children}:{children:React.ReactNode}){return children}
