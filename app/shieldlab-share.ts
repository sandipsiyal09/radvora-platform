export const SHARE_DEVICES={
  iphone:{brand:'Apple',name:'iPhone 17',category:'Smartphone'},
  galaxy:{brand:'Samsung',name:'Galaxy S26',category:'Smartphone'},
  oppo:{brand:'OPPO',name:'Reno16 5G',category:'Smartphone'},
  vivo:{brand:'vivo',name:'V50',category:'Smartphone'},
  ipad:{brand:'Apple',name:'iPad Air',category:'Tablet'},
  tabs11:{brand:'Samsung',name:'Galaxy Tab S11',category:'Tablet'},
  macbook:{brand:'Apple',name:'MacBook Air',category:'Laptop'},
  xps:{brand:'Dell',name:'XPS 13',category:'Laptop'},
  buds:{brand:'Samsung',name:'Galaxy Buds3 FE Case',category:'Accessory'},
  powerbank:{brand:'Samsung',name:'20,000mAh Battery Pack',category:'Accessory'},
} as const

export const SHARE_FINISHES={
  obsidian:{name:'Obsidian',base:'#0b0d10',edge:'#606871',accent:'#85eaff',text:'#f8fbfd'},
  titanium:{name:'Titanium',base:'#adb4bb',edge:'#f3f6f8',accent:'#d8f8ff',text:'#111820'},
  graphite:{name:'Graphite',base:'#34383e',edge:'#7a838b',accent:'#9defff',text:'#f7fafc'},
  arctic:{name:'Arctic',base:'#edf1f3',edge:'#ffffff',accent:'#baf3ff',text:'#15202a'},
  midnight:{name:'Midnight',base:'#15273f',edge:'#5c7594',accent:'#7acaff',text:'#f7fbff'},
  rose:{name:'Rose',base:'#9d7069',edge:'#deb7b0',accent:'#ffd0c5',text:'#fffaf8'},
  forest:{name:'Forest',base:'#213d35',edge:'#6d8c82',accent:'#8ff0d4',text:'#f6fffb'},
  champagne:{name:'Champagne',base:'#b99f73',edge:'#e7d4ae',accent:'#ffe4a8',text:'#211b12'},
} as const

export type ShareDeviceId=keyof typeof SHARE_DEVICES
export type ShareFinishId=keyof typeof SHARE_FINISHES

export function resolveShareBuild(device:unknown,finish:unknown){
  const deviceId=typeof device==='string'&&device in SHARE_DEVICES?device as ShareDeviceId:'iphone'
  const finishId=typeof finish==='string'&&finish in SHARE_FINISHES?finish as ShareFinishId:'obsidian'
  return {deviceId,finishId,device:SHARE_DEVICES[deviceId],finish:SHARE_FINISHES[finishId]}
}

export function buildShareTitle(device:unknown,finish:unknown){
  const build=resolveShareBuild(device,finish)
  return `${build.device.brand} ${build.device.name} · ${build.finish.name} — RADVORA ShieldLab`
}
