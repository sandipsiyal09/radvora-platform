import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const requiredRuntimeConfig = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

function responseHeaders() {
  return { 'Cache-Control': 'no-store' }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const configurationReady = requiredRuntimeConfig.every((key) => Boolean(process.env[key]?.trim()))
  const canonicalUrlReady = (()=>{
    try{return new URL(process.env.NEXT_PUBLIC_APP_URL||'').protocol==='https:'}catch{return false}
  })()
  const indiaPaymentsConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
    process.env.RAZORPAY_KEY_SECRET?.trim() &&
    process.env.RAZORPAY_WEBHOOK_SECRET?.trim(),
  )

  if (!configurationReady) {
    return NextResponse.json(
      {
        service: 'radvora-platform',
        status: 'degraded',
        checks: {
          configuration: 'unavailable',
          database: 'not_checked',
          canonical_url: canonicalUrlReady ? 'configured' : 'not_configured',
          india_payments: indiaPaymentsConfigured ? 'configured' : 'not_configured',
        },
        timestamp,
      },
      { status: 503, headers: responseHeaders() },
    )
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) throw error

    return NextResponse.json(
      {
        service: 'radvora-platform',
        status: 'ok',
        checks: {
          configuration: 'ok',
          database: 'ok',
          canonical_url: canonicalUrlReady ? 'configured' : 'not_configured',
          india_payments: indiaPaymentsConfigured ? 'configured' : 'not_configured',
        },
        timestamp,
      },
      { status: 200, headers: responseHeaders() },
    )
  } catch (error) {
    console.error('health_check_failed', error)
    return NextResponse.json(
      {
        service: 'radvora-platform',
        status: 'degraded',
        checks: {
          configuration: 'ok',
          database: 'unavailable',
          canonical_url: canonicalUrlReady ? 'configured' : 'not_configured',
          india_payments: indiaPaymentsConfigured ? 'configured' : 'not_configured',
        },
        timestamp,
      },
      { status: 503, headers: responseHeaders() },
    )
  }
}
