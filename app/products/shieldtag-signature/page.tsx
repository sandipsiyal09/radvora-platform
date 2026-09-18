import type { Metadata } from 'next'
import ShieldTagFormatPage from '../format-page'

export const metadata:Metadata={title:'ShieldTag Signature',description:'RADVORA ShieldTag Signature is the smartphone-proportioned member of the ShieldTag device identity system.',alternates:{canonical:'/products/shieldtag-signature'}}

export default function Page(){return <ShieldTagFormatPage label="ShieldTag Signature" device="Smartphones" headline="Built for the device" accent="you touch most." intro="ShieldTag Signature is the compact smartphone format in the RADVORA identity system—proportioned to sit naturally beside modern phone hardware." proportion="Signature uses the most compact public ShieldTag proportion so the mark can remain visually balanced on approved smartphone rear surfaces." placement="Approved placement should stay clear of camera systems, flash, controls, charging zones and other functional hardware." finish="Use ShieldLab to preview a close device match or a deliberate contrast before deciding on the visual direction." slug="shieldtag-signature"/>}
