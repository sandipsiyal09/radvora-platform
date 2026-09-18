import { ImageResponse } from 'next/og'

export const alt='RADVORA ShieldTag — One Shield. Every Device.'
export const size={width:1200,height:630}
export const contentType='image/png'

export default function OpenGraphImage(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'76px 84px',background:'radial-gradient(circle at 78% 12%, #153445 0%, #071017 34%, #030507 72%)',color:'#f4f7f9',fontFamily:'Arial, sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:22}}>
        <div style={{width:72,height:48,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,.18)',borderRadius:14,color:'#8eeaff',fontSize:28,fontWeight:800}}>R</div>
        <div style={{display:'flex',flexDirection:'column'}}><span style={{fontSize:24,fontWeight:800,letterSpacing:8}}>RADVORA</span><span style={{fontSize:12,letterSpacing:5,color:'#82a0ad'}}>SHIELDTAG</span></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:22,maxWidth:980}}>
        <span style={{fontSize:18,letterSpacing:6,color:'#6be4fb'}}>PREMIUM DEVICE IDENTITY</span>
        <div style={{display:'flex',flexDirection:'column',fontSize:82,lineHeight:.98,fontWeight:700,letterSpacing:-4}}><span>One Shield.</span><span>Every Device.</span></div>
        <div style={{fontSize:24,lineHeight:1.4,color:'#9badb7'}}>A device-aware identity system for phones, tablets, laptops and selected technology accessories.</div>
      </div>
    </div>,size
  )
}
