import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RADVORA Technologies — Technology you can measure',
  description: 'Premium RF-focused accessories and digital-wellness technology built around measurable engineering and transparent testing.',
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>
}
