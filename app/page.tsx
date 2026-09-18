import type { Metadata } from 'next'
import RealDeviceExperience from './real-device-experience'

export const metadata: Metadata = {
  title:{absolute:'RADVORA ShieldTag — One Shield. Every Device.'},
  description:'Build a RADVORA ShieldTag look for smartphones, tablets, laptops and accessories, compare finish directions, save or share the build, then verify exact model compatibility and availability.',
  alternates:{canonical:'/'},
  openGraph:{
    url:'/',
    title:'RADVORA ShieldTag — One Shield. Every Device.',
    description:'Choose the device. Tune the finish. Save or share the exact ShieldTag build. Verify fit before purchase.'
  },
  twitter:{
    card:'summary_large_image',
    title:'RADVORA ShieldTag — One Shield. Every Device.',
    description:'Choose the device. Tune the finish. Save or share the exact ShieldTag build. Verify fit before purchase.'
  }
}

export default function Home(){return <RealDeviceExperience/>}
