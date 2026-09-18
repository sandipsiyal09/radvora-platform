import type { Metadata } from 'next'
import RealDeviceExperience from './real-device-experience'
import { buildShareTitle, resolveShareBuild } from './shieldlab-share'

type SearchParams=Promise<{device?:string|string[];finish?:string|string[]}>

function one(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}

export async function generateMetadata({searchParams}:{searchParams:SearchParams}):Promise<Metadata>{
  const params=await searchParams
  const device=one(params.device)
  const finish=one(params.finish)
  const hasBuild=Boolean(device||finish)
  const resolved=resolveShareBuild(device,finish)
  const title=hasBuild?buildShareTitle(device,finish):'RADVORA ShieldTag — One Shield. Every Device.'
  const description=hasBuild
    ? `Open this RADVORA ShieldLab build: ${resolved.device.brand} ${resolved.device.name} with ${resolved.finish.name}. Styling preview only; verify exact model fit separately.`
    : 'Build a RADVORA ShieldTag look for smartphones, tablets, laptops and accessories, compare finish directions, save or share the build, then verify exact model compatibility and availability.'
  const query=`?device=${encodeURIComponent(resolved.deviceId)}&finish=${encodeURIComponent(resolved.finishId)}`
  const image=`/api/share-card${query}`

  return {
    title:{absolute:title},
    description,
    alternates:{canonical:'/'},
    openGraph:{
      type:'website',
      url:hasBuild?`/${query}`:'/',
      title,
      description,
      images:[{url:image,width:1200,height:630,alt:`${resolved.device.brand} ${resolved.device.name} · ${resolved.finish.name} RADVORA ShieldTag build`}]
    },
    twitter:{
      card:'summary_large_image',
      title,
      description,
      images:[image]
    }
  }
}

export default function Home(){return <RealDeviceExperience/>}
