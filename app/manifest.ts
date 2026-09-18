import type { MetadataRoute } from 'next'

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'RADVORA ShieldTag',
    short_name:'RADVORA',
    description:'Premium device identity designed for smartphones, tablets, laptops and selected technology accessories.',
    start_url:'/',
    display:'standalone',
    background_color:'#05070a',
    theme_color:'#05070a',
    icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}]
  }
}
