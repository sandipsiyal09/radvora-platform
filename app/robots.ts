import type { MetadataRoute } from 'next'

export default function robots():MetadataRoute.Robots{
  const base=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'
  return {
    rules:[
      {userAgent:'*',allow:'/',disallow:['/admin/','/account/','/cart/','/checkout/']}
    ],
    sitemap:`${base}/sitemap.xml`,
    host:base
  }
}
