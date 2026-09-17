'use client'

import { CSSProperties, useEffect, useMemo, useState } from 'react'
import ui from './device-shield-showcase.module.css'

type Finish = {
  id: string
  name: string
  base: string
  edge: string
  glow: string
  text: string
}

type Device = {
  id: string
  index: string
  name: string
  detail: string
  defaultFinish: string
}

const finishes: Finish[] = [
  { id: 'obsidian', name: 'Obsidian Black', base: '#080b10', edge: '#66717d', glow: '#54ddff', text: '#f5fbff' },
  { id: 'titanium', name: 'Titanium Silver', base: '#b4bcc5', edge: '#eef4f8', glow: '#b8f6ff', text: '#111820' },
  { id: 'graphite', name: 'Graphite Gray', base: '#323944', edge: '#8e9aa7', glow: '#70d7ff', text: '#f7fbff' },
  { id: 'midnight', name: 'Midnight Blue', base: '#102445', edge: '#567eac', glow: '#3da7ff', text: '#f5fbff' },
  { id: 'arctic', name: 'Arctic White', base: '#e9edf1', edge: '#ffffff', glow: '#8ff3ff', text: '#18212a' },
  { id: 'rose', name: 'Rose Gold', base: '#9d625a', edge: '#dcae9f', glow: '#ffc1bb', text: '#fff8f5' },
  { id: 'forest', name: 'Forest Green', base: '#16392f', edge: '#5f8f7f', glow: '#63f1c8', text: '#effff9' },
  { id: 'red', name: 'Deep Red', base: '#5f1118', edge: '#ae4d58', glow: '#ff586b', text: '#fff6f7' },
]

const devices: Device[] = [
  { id: 'phone', index: '01', name: 'Smartphone', detail: 'Pocket flagship', defaultFinish: 'obsidian' },
  { id: 'tablet', index: '02', name: 'Tablet', detail: 'Large-format device', defaultFinish: 'titanium' },
  { id: 'laptop', index: '03', name: 'Laptop', detail: 'Desk + travel setup', defaultFinish: 'midnight' },
  { id: 'earbuds', index: '04', name: 'Earbuds', detail: 'Compact carry case', defaultFinish: 'arctic' },
  { id: 'power', index: '05', name: 'Power bank', detail: 'Portable charging', defaultFinish: 'red' },
]

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 9h43L39 24H24l-5 6h25L27 50l-7-8 8-9H13L7 26l15-17Z" fill="currentColor"/>
      <path d="M31 24h14L34 36l-8-8 5-4Z" fill="currentColor" opacity=".62"/>
    </svg>
  )
}

function Shield({ finish }: { finish: Finish }) {
  const style = {
    '--finish-base': finish.base,
    '--finish-edge': finish.edge,
    '--finish-glow': finish.glow,
    '--finish-text': finish.text,
  } as CSSProperties

  return (
    <div className={ui.shield} style={style} aria-label={`RADVORA ShieldTag preview in ${finish.name}`}>
      <div className={ui.shieldEdge} />
      <div className={ui.shieldFace}>
        <span className={ui.shieldLogo}><LogoMark /></span>
        <strong>RADVORA</strong>
        <small>A HIGHER STANDARD</small>
        <i className={ui.shieldGlow} />
        <span className={ui.microTexture} />
      </div>
    </div>
  )
}

function DeviceMock({ device, finish }: { device: Device; finish: Finish }) {
  return (
    <div className={ui.deviceScene} data-device={device.id}>
      <div className={ui.sceneHalo} />
      <div className={ui.sceneOrbit} />
      <div className={ui.deviceMock}>
        <div className={ui.deviceSurface}>
          <div className={ui.deviceDetails} aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <Shield finish={finish} />
        </div>
        <div className={ui.deviceBase} aria-hidden="true" />
      </div>
      <div className={ui.sceneLabel}>
        <span>{device.index}</span>
        <div><b>{device.name}</b><small>{device.detail}</small></div>
      </div>
      <div className={ui.motionTrail} aria-hidden="true"><i /><i /><i /></div>
    </div>
  )
}

export default function DeviceShieldShowcase() {
  const [activeDevice, setActiveDevice] = useState(0)
  const [finishId, setFinishId] = useState(devices[0].defaultFinish)
  const [autoMatch, setAutoMatch] = useState(true)
  const [paused, setPaused] = useState(false)

  const device = devices[activeDevice]
  const finish = useMemo(() => finishes.find(item => item.id === finishId) ?? finishes[0], [finishId])

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setActiveDevice(current => {
        const next = (current + 1) % devices.length
        if (autoMatch) setFinishId(devices[next].defaultFinish)
        return next
      })
    }, 4200)
    return () => window.clearInterval(timer)
  }, [paused, autoMatch])

  const selectDevice = (index: number) => {
    setActiveDevice(index)
    if (autoMatch) setFinishId(devices[index].defaultFinish)
  }

  const matchDevice = () => {
    setAutoMatch(true)
    setFinishId(device.defaultFinish)
  }

  return (
    <section className={ui.section} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={ui.ambientA} /><div className={ui.ambientB} />
      <div className={ui.shell}>
        <div className={ui.heading}>
          <span className={ui.kicker}>SHIELDTAG DEVICE STUDIO / LIVE PREVIEW</span>
          <h2>One Shield. <em>Every Device.</em></h2>
          <p>See RADVORA ShieldTag move across the devices customers use every day, then preview a finish that visually complements the device they own.</p>
        </div>

        <div className={ui.studio}>
          <div className={ui.stage} aria-live="polite">
            <DeviceMock key={`${device.id}-${finish.id}`} device={device} finish={finish} />
            <div className={ui.stageTopline}><span>AUTO DEVICE TRANSITION</span><b>{paused ? 'PAUSED' : 'PLAYING'}</b></div>
            <div className={ui.stageBottomline}><span>{device.name.toUpperCase()}</span><b>{finish.name.toUpperCase()}</b></div>
          </div>

          <aside className={ui.controls}>
            <div className={ui.controlHeader}>
              <span>DEVICE TRANSITION</span>
              <button type="button" onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button>
            </div>
            <div className={ui.deviceRail}>
              {devices.map((item, index) => (
                <button type="button" key={item.id} className={index === activeDevice ? ui.deviceActive : ''} onClick={() => selectDevice(index)}>
                  <span>{item.index}</span><div><b>{item.name}</b><small>{item.detail}</small></div><i>→</i>
                </button>
              ))}
            </div>

            <div className={ui.matchCard}>
              <div><span>SMART MATCH</span><b>{autoMatch ? 'Matching device finish' : 'Manual finish selected'}</b></div>
              <button type="button" onClick={matchDevice}>Match device</button>
            </div>
          </aside>
        </div>

        <div className={ui.finishPanel}>
          <div className={ui.finishIntro}>
            <span>CHOOSE YOUR SHIELDTAG FINISH</span>
            <h3>Match it. Contrast it. Make it yours.</h3>
            <p>These are visual finish previews for the landing-page experience. Sellable variants and availability should continue to come from approved catalog data.</p>
          </div>
          <div className={ui.finishGrid}>
            {finishes.map(item => (
              <button type="button" key={item.id} onClick={() => { setFinishId(item.id); setAutoMatch(false) }} className={item.id === finish.id ? ui.finishActive : ''} aria-pressed={item.id === finish.id}>
                <span className={ui.finishSwatch} style={{ '--swatch': item.base, '--swatch-edge': item.edge, '--swatch-glow': item.glow } as CSSProperties}><i /></span>
                <b>{item.name}</b>
              </button>
            ))}
          </div>
        </div>

        <div className={ui.conversionBar}>
          <div><span>DIFFERENT DEVICES.</span><b>SAME RADVORA DESIGN LANGUAGE.</b></div>
          <div className={ui.ctas}><a href="/products/shieldtag-pro">Explore ShieldTag <span>→</span></a><a href="/compatibility">Check compatibility</a></div>
        </div>
      </div>
    </section>
  )
}
