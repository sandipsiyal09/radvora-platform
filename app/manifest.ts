import type { MetadataRoute } from 'next'

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'RADVORA ShieldLab',
    short_name:'RADVORA',
    description:'Build, save and share a RADVORA ShieldTag look, then verify exact device compatibility separately.',
    start_url:'/#shieldlab',
    scope:'/',
    display:'standalone',
    background_color:'#05070a',
    theme_color:'#05070a',
    orientation:'portrait-primary',
    categories:['shopping','lifestyle','utilities'],
    icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}]
  }
}
