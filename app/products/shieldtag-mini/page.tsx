import type { Metadata } from 'next'
import ShieldTagFormatPage from '../format-page'

export const metadata:Metadata={title:'ShieldTag Mini',description:'RADVORA ShieldTag Mini is the compact-accessory member of the ShieldTag device identity system.',alternates:{canonical:'/products/shieldtag-mini'}}

export default function Page(){return <ShieldTagFormatPage label="ShieldTag Mini" device="Compact accessories" headline="Small format." accent="Same identity." intro="ShieldTag Mini brings the RADVORA visual system to supported compact technology where the larger formats would overpower the device." proportion="Mini reduces the visual footprint for smaller approved surfaces while preserving the recognizable RADVORA identity language." placement="Keep charging contacts, lids, hinges, microphones, sensors, buttons and other functional zones clear." finish="Use ShieldLab to test how the smaller badge relates to compact hardware before relying on exact device compatibility."/>}
