import './globals.css'
import type { Metadata } from 'next'

const siteUrl=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'

export const metadata: Metadata = {
  metadataBase:new URL(siteUrl),
  title:{default:'RADVORA Technologies — Technology you can measure',template:'%s | RADVORA Technologies'},
  description:'Premium RF-focused accessories and digital-wellness technology built around measurable engineering and transparent testing.',
  applicationName:'RADVORA Technologies',
  alternates:{canonical:'/'},
  openGraph:{
    type:'website',
    url:'/',
    siteName:'RADVORA Technologies',
    title:'RADVORA Technologies — Technology you can measure',
    description:'RF-focused accessories and digital-wellness technology built around measurable engineering and transparent testing.'
  },
  twitter:{card:'summary_large_image',title:'RADVORA Technologies',description:'Technology you can measure.'},
  robots:{index:true,follow:true}
}

const organizationSchema={
  '@context':'https://schema.org',
  '@type':'Organization',
  name:'RADVORA Technologies',
  url:siteUrl,
  slogan:'Smarter Technology. Smarter Exposure.',
  description:'Consumer technology company developing RF-focused accessories and digital-wellness products with evidence-gated product claims.'
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}}/>{children}</body></html>
}
