import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const requiredRuntimeConfig = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

function responseHeaders() {
  return { 'Cache-Control': 'no-store' }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const configurationReady = requiredRuntimeConfig.every((key) => Boolean(process.env[key]))

  if (!configurationReady) {
    return NextResponse.json(
      {
        service: 'radvora-platform',
        status: 'degraded',
        checks: {
          configuration: 'unavailable',
          database: 'not_checked',
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
        },
        timestamp,
      },
      { status: 503, headers: responseHeaders() },
    )
  }
}
