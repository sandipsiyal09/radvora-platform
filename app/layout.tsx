import './globals.css'
import './cinematic-closing.css'
import './editorial-product-rails.css'
import './cinematic-hero-focus.css'
import './cinematic-shieldlab-focus.css'
import './cinematic-shieldlab-continuity.css'
import './cinematic-compatibility-handoff.css'
import './cinematic-products-handoff.css'
import './cinematic-research-handoff.css'
import './cinematic-labs-handoff.css'
import './cinematic-business-handoff.css'
import './cinematic-about-handoff.css'
import './cinematic-verification-handoff.css'
import './cinematic-contact-handoff.css'
import './cinematic-support-handoff.css'
import './cinematic-home-polish.css'
import './cinematic-home-surface-depth.css'
import type { Metadata, Viewport } from 'next'

const siteUrl=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'

export const metadata: Metadata = {
  metadataBase:new URL(siteUrl),
  title:{default:'RADVORA ShieldTag — One Shield. Every Device.',template:'%s | RADVORA'},
  description:'RADVORA ShieldTag is a premium device identity badge system designed for smartphones, tablets, laptops and selected technology accessories.',
  applicationName:'RADVORA',
  appleWebApp:{capable:true,title:'RADVORA',statusBarStyle:'black-translucent'},
  openGraph:{
    type:'website',
    siteName:'RADVORA',
    title:'RADVORA ShieldTag — One Shield. Every Device.',
    description:'Premium device identity designed to look native to the technology you already own.'
  },
  twitter:{card:'summary_large_image',title:'RADVORA ShieldTag',description:'One Shield. Every Device.'},
  robots:{index:true,follow:true}
}

export const viewport:Viewport={themeColor:'#050607',colorScheme:'dark'}

const organizationSchema={
  '@context':'https://schema.org',
  '@type':'Organization',
  name:'RADVORA',
  url:siteUrl,
  slogan:'One Shield. Every Device.',
  description:'Consumer technology brand developing premium device identity products with compatibility and product claims kept explicit and evidence-controlled.'
}

const websiteSchema={
  '@context':'https://schema.org',
  '@type':'WebSite',
  name:'RADVORA',
  url:siteUrl,
  description:'RADVORA ShieldTag is a premium device identity system for smartphones, tablets, laptops and selected technology accessories.'
}

function safeJson(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c')}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(organizationSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(websiteSchema)}}/>{children}</body></html>
}
