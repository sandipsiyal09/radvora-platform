import type { Metadata } from 'next'
import ShieldTagFormatPage from '../format-page'

export const metadata:Metadata={title:'ShieldTag Executive',description:'RADVORA ShieldTag Executive is the laptop-proportioned member of the ShieldTag device identity system.',alternates:{canonical:'/products/shieldtag-executive'}}

export default function Page(){return <ShieldTagFormatPage label="ShieldTag Executive" device="Laptops" headline="A hardware plaque" accent="for your computer." intro="ShieldTag Executive is the restrained laptop format in the RADVORA system—designed to read more like part of the machine than an added sticker." proportion="Executive uses a broader footprint suited to larger laptop surfaces and a more architectural visual presence." placement="Keep vents, ports, hinges, speakers, controls and manufacturer functional zones clear according to approved guidance." finish="Metallic and dark finish directions are available in ShieldLab so the badge can either blend with the chassis or create a deliberate contrast." slug="shieldtag-executive"/>}
