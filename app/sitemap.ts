import type { MetadataRoute } from 'next'

export default function sitemap():MetadataRoute.Sitemap{
  const base=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'
  const routes=[
    '',
    '/products',
    '/products/shieldtag-core',
    '/products/shieldtag-elite',
    '/products/shieldtag-pro',
    '/products/family-pack',
    '/products/safestand',
    '/products/rf-case',
    '/labs',
    '/research',
    '/compatibility',
    '/verify',
    '/installation',
    '/warranty',
    '/support',
    '/about',
    '/contact',
    '/business',
    '/dealer',
    '/distributor',
    '/privacy',
    '/terms',
    '/returns',
    '/shipping',
    '/login'
  ]
  return routes.map(path=>({
    url:`${base}${path}`,
    lastModified:new Date(),
    changeFrequency:path===''?'weekly':'monthly',
    priority:path===''?1:path==='/products'?0.9:0.7
  }))
}
