import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { resolveShareBuild } from '../shieldlab-share'

export const runtime='nodejs'

export async function GET(request:NextRequest){
  const {searchParams}=request.nextUrl
  const build=resolveShareBuild(searchParams.get('device'),searchParams.get('finish'))
  const title=`${build.device.brand} ${build.device.name}`
  const subtitle=`${build.finish.name} · ${build.device.category}`

  return new ImageResponse(
    <div style={{
      width:'1200px',height:'630px',display:'flex',position:'relative',overflow:'hidden',
      background:'radial-gradient(circle at 72% 38%, rgba(118,230,255,.13), transparent 24%), linear-gradient(145deg,#0c1116,#050607 70%)',
      color:'#f4f7f9',fontFamily:'Arial, Helvetica, sans-serif'
    }}>
      <div style={{position:'absolute',inset:'0',display:'flex',opacity:.055,backgroundImage:'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',backgroundSize:'54px 54px'}}/>
      <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:'54%',padding:'58px 0 54px 64px',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{width:'46px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,.28)',fontSize:'13px',letterSpacing:'2px'}}>RV</div>
          <div style={{display:'flex',flexDirection:'column'}}>
            <b style={{fontSize:'22px',letterSpacing:'7px'}}>RADVORA</b>
            <span style={{fontSize:'10px',letterSpacing:'4px',color:'#7f8c95',marginTop:'5px'}}>SHIELDLAB</span>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column'}}>
          <span style={{fontSize:'14px',letterSpacing:'4px',color:'#76e6ff',marginBottom:'20px'}}>MY SHIELDTAG BUILD</span>
          <div style={{display:'flex',fontSize:'66px',lineHeight:1.02,letterSpacing:'-3px',fontWeight:700,maxWidth:'610px'}}>{title}</div>
          <div style={{display:'flex',fontSize:'24px',color:'#98a4ad',marginTop:'18px'}}>{subtitle}</div>
        </div>

        <div style={{display:'flex',fontSize:'14px',letterSpacing:'3px',color:'#73808a'}}>ONE SHIELD. EVERY DEVICE.</div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'46%',position:'relative',zIndex:2}}>
        <div style={{position:'absolute',width:'420px',height:'420px',borderRadius:'999px',background:'rgba(118,230,255,.09)',filter:'blur(50px)'}}/>
        <div style={{
          width:'330px',height:'198px',display:'flex',alignItems:'center',position:'relative',
          clipPath:'polygon(11% 0,89% 0,100% 15%,100% 85%,89% 100%,11% 100%,0 85%,0 15%)',
          background:`linear-gradient(135deg,${build.finish.edge},#ffffff 30%,#41474e 75%,${build.finish.edge})`,
          filter:'drop-shadow(0 28px 36px rgba(0,0,0,.45))'
        }}>
          <div style={{
            position:'absolute',inset:'8px',display:'flex',alignItems:'center',gap:'18px',padding:'0 28px',
            clipPath:'polygon(11% 0,89% 0,100% 15%,100% 85%,89% 100%,11% 100%,0 85%,0 15%)',
            background:build.finish.base,color:build.finish.text
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'48px',height:'48px',border:'1px solid currentColor',opacity:.78,fontSize:'13px',letterSpacing:'2px'}}>RV</div>
            <div style={{display:'flex',flexDirection:'column'}}>
              <b style={{fontSize:'22px',letterSpacing:'5px'}}>RADVORA</b>
              <span style={{fontSize:'10px',letterSpacing:'3px',opacity:.72,marginTop:'5px'}}>{build.device.category.toUpperCase()}</span>
            </div>
            <div style={{position:'absolute',left:'0',right:'0',bottom:'34px',height:'2px',background:`linear-gradient(90deg,transparent,${build.finish.accent},transparent)`}}/>
          </div>
        </div>
      </div>
    </div>,
    {
      width:1200,
      height:630,
      headers:{
        'Cache-Control':'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options':'nosniff'
      }
    }
  )
}
