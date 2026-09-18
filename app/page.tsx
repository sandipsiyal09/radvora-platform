import type { Metadata } from 'next'
import RealDeviceExperience from './real-device-experience'

export const metadata: Metadata = {
  title:{absolute:'RADVORA ShieldTag — Identity Engineered to Belong'},
  description:'Explore RADVORA ShieldTag across real device contexts, compare finish directions, verify model-specific compatibility, and follow placement guidance.',
  alternates:{canonical:'/'},
  openGraph:{
    url:'/',
    title:'RADVORA ShieldTag — Identity Engineered to Belong',
    description:'A product-led device identity experience: choose the hardware context, tune the finish, verify compatibility, then follow placement guidance.'
  }
}

export default function Home() {
  return <RealDeviceExperience />
}
