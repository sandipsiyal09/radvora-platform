import type { MetadataRoute } from 'next'

export default function sitemap():MetadataRoute.Sitemap{
  const base=process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app'
  const routes=['','/products/shieldtag-pro','/labs','/compatibility','/verify','/business','/dealer','/distributor','/login']
  return routes.map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===''?'weekly':'monthly',priority:path===''?1:0.7}))
}
