import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const requiredRuntimeConfig = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

function responseHeaders() {
  return { 'Cache-Control': 'no-store' }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const configurationReady = requiredRuntimeConfig.every((key) => Boolean(process.env[key]))
  const indiaPaymentsConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET,
  )

  if (!configurationReady) {
    return NextResponse.json(
      {
        service: 'radvora-platform',
        status: 'degraded',
        checks: {
          configuration: 'unavailable',
          database: 'not_checked',
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
          india_payments: indiaPaymentsConfigured ? 'configured' : 'not_configured',
        },
        timestamp,
      },
      { status: 503, headers: responseHeaders() },
    )
  }
}
