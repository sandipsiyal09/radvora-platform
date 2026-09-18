import type { Metadata } from 'next'
import RealDeviceExperience from './real-device-experience'

export const metadata: Metadata = {
  title:{absolute:'RADVORA ShieldTag — Make the Device Yours'},
  description:'Build and share a RADVORA ShieldTag look for real device contexts, compare finish directions, then verify model-specific compatibility and product availability.',
  alternates:{canonical:'/'},
  openGraph:{
    url:'/',
    title:'RADVORA ShieldTag — Make the Device Yours',
    description:'Open ShieldLab, choose a device and finish, save or share the exact build, then verify model fit.'
  },
  twitter:{
    card:'summary_large_image',
    title:'RADVORA ShieldTag — Make the Device Yours',
    description:'Open ShieldLab, choose a device and finish, save or share the exact build, then verify model fit.'
  }
}

export default function Home(){return <RealDeviceExperience/>}
