import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const SERIAL_PATTERN = /^[A-Z0-9][A-Z0-9-]{4,63}$/
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 20

type AttemptWindow = { count: number; resetAt: number }
const attempts = new Map<string, AttemptWindow>()

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  if (current.count > MAX_ATTEMPTS) return true
  attempts.set(key, current)
  return false
}

export async function POST(request: NextRequest) {
  const key = clientKey(request)
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please try again later.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const serial = typeof body.serial === 'string' ? body.serial.trim().toUpperCase() : ''
  if (!SERIAL_PATTERN.test(serial)) {
    return NextResponse.json(
      { error: 'Enter a valid RADVORA serial.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('public_product_verification')
      .select('serial_number,batch_code,manufactured_at,status,product_name,product_slug,sku')
      .eq('serial_number', serial)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(
      { result: data ?? null },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('product_verification_failed', error)
    return NextResponse.json(
      { error: 'Verification is temporarily unavailable. Please try again shortly.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
