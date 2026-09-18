import type { MetadataRoute } from 'next'

export default function sitemap():MetadataRoute.Sitemap{
  const base=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'
  const routes=[
    '',
    '/products',
    '/products/shieldtag-signature',
    '/products/shieldtag-pro',
    '/products/shieldtag-executive',
    '/products/shieldtag-mini',
    '/compatibility',
    '/installation',
    '/research',
    '/labs',
    '/verify',
    '/warranty',
    '/support',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/returns',
    '/shipping',
    '/business',
    '/dealer',
    '/distributor'
  ]
  return routes.map(path=>({
    url:base+path,
    changeFrequency:path===''?'weekly':'monthly',
    priority:path===''?1:path==='/products'?0.9:0.7
  }))
}
