import './globals.css'
import type { Metadata } from 'next'

const siteUrl=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'

export const metadata: Metadata = {
  metadataBase:new URL(siteUrl),
  title:{default:'RADVORA ShieldTag — One Shield. Every Device.',template:'%s | RADVORA'},
  description:'RADVORA ShieldTag is a premium device identity badge system designed for smartphones, tablets, laptops and selected technology accessories.',
  applicationName:'RADVORA',
  openGraph:{
    type:'website',
    siteName:'RADVORA',
    title:'RADVORA ShieldTag — One Shield. Every Device.',
    description:'Premium device identity designed to look native to the technology you already own.'
  },
  twitter:{card:'summary_large_image',title:'RADVORA ShieldTag',description:'One Shield. Every Device.'},
  robots:{index:true,follow:true}
}

const organizationSchema={
  '@context':'https://schema.org',
  '@type':'Organization',
  name:'RADVORA',
  url:siteUrl,
  slogan:'One Shield. Every Device.',
  description:'Consumer technology brand developing premium device identity products with compatibility and product claims kept explicit and evidence-controlled.'
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}}/>{children}</body></html>
}
