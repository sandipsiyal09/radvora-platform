'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

export default function GlobalMotion(){
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if(reduced)return

    const root=document.documentElement
    root.dataset.motion='enhanced'

    const sections=Array.from(document.querySelectorAll<HTMLElement>('main > section'))
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue
        const el=entry.target as HTMLElement
        observer.unobserve(el)
        gsap.fromTo(el,{autoAlpha:.72,y:22,scale:.995},{autoAlpha:1,y:0,scale:1,duration:.72,ease:'power3.out',clearProps:'opacity,visibility,transform'})
      }
    },{threshold:.08,rootMargin:'0px 0px -8% 0px'})
    sections.forEach(section=>observer.observe(section))

    const onClick=(event:MouseEvent)=>{
      const anchor=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      if(!anchor)return
      const id=anchor.getAttribute('href')?.slice(1)
      if(!id)return
      const target=document.getElementById(id)
      if(!target)return
      event.preventDefault()
      const state=Flip.getState(target,{props:'opacity,transform'})
      target.scrollIntoView({behavior:'smooth',block:'start'})
      requestAnimationFrame(()=>Flip.from(state,{targets:target,duration:.8,ease:'power3.inOut',absolute:false,scale:true,simple:true}))
      history.replaceState(null,'',`#${id}`)
    }

    document.addEventListener('click',onClick)
    return ()=>{
      observer.disconnect()
      document.removeEventListener('click',onClick)
      delete root.dataset.motion
      gsap.killTweensOf(sections)
    }
  },[])

  return null
}
