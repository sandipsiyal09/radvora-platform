import type { Metadata } from 'next'

export const metadata:Metadata={
  title:'Device Compatibility',
  description:'Check exact RADVORA ShieldTag compatibility by device category, manufacturer and model. Unreviewed models remain explicitly unconfirmed.',
  alternates:{canonical:'/compatibility'}
}

export default function CompatibilityLayout({children}:{children:React.ReactNode}){return children}
