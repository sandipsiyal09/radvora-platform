type ProductSchemaProps={
  name:string
  slug:string
  deviceClass:string
  description:string
}

const siteUrl=(process.env.NEXT_PUBLIC_APP_URL||'https://radvora-platform.vercel.app').replace(/\/$/,'')

function safeJson(value:unknown){
  return JSON.stringify(value).replace(/</g,'\\u003c')
}

export default function ProductStructuredData({name,slug,deviceClass,description}:ProductSchemaProps){
  const url=`${siteUrl}/products/${slug}`
  const product={
    '@context':'https://schema.org',
    '@type':'Product',
    name,
    url,
    description,
    brand:{'@type':'Brand',name:'RADVORA'},
    category:deviceClass,
    additionalProperty:[
      {'@type':'PropertyValue',name:'Device class',value:deviceClass},
      {'@type':'PropertyValue',name:'Finish directions',value:'8'},
      {'@type':'PropertyValue',name:'Compatibility',value:'Model-specific'}
    ]
  }
  const breadcrumb={
    '@context':'https://schema.org',
    '@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'RADVORA',item:siteUrl},
      {'@type':'ListItem',position:2,name:'Products',item:`${siteUrl}/products`},
      {'@type':'ListItem',position:3,name,item:url}
    ]
  }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(product)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(breadcrumb)}}/>
  </>
}
