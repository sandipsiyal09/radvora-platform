import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const SERIAL_PATTERN = /^[A-Z0-9][A-Z0-9-]{4,63}$/
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 20
const MAX_BODY_BYTES = 1024
const MAX_RATE_KEYS = 5000

type AttemptWindow = { count: number; resetAt: number }
const attempts = new Map<string, AttemptWindow>()

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

function pruneAttempts(now: number) {
  if (attempts.size < MAX_RATE_KEYS) return
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key)
  }
  if (attempts.size >= MAX_RATE_KEYS) {
    const overflow = attempts.size - MAX_RATE_KEYS + 1
    let removed = 0
    for (const key of attempts.keys()) {
      attempts.delete(key)
      removed += 1
      if (removed >= overflow) break
    }
  }
}

function isRateLimited(key: string) {
  const now = Date.now()
  pruneAttempts(now)
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

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV)
}

function isSafeProductionOrigin(url: URL) {
  const hostname = url.hostname.toLowerCase()
  const isIpLiteral = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')
  return url.protocol === 'https:' &&
    !url.username && !url.password &&
    !isIpLiteral && hostname !== 'localhost' && !hostname.endsWith('.') && hostname.includes('.') &&
    (url.pathname === '/' || url.pathname === '') && !url.search && !url.hash &&
    (url.port === '' || url.port === '443')
}

function canonicalOrigin(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    try {
      const url = new URL(configured)
      if (isProductionRuntime()) return isSafeProductionOrigin(url) ? url.origin : null
      if (url.protocol === 'https:' || url.hostname === 'localhost') return url.origin
    } catch {
      // Production public mutations fail closed below instead of trusting request.nextUrl.
    }
  }
  if (isProductionRuntime()) return null
  const requestOrigin = request.nextUrl.origin
  try {
    const url = new URL(requestOrigin)
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url.origin : null
  } catch {
    return null
  }
}

function invalidOrigin(request: NextRequest, canonical: string) {
  if (request.headers.get('sec-fetch-site')?.toLowerCase() === 'cross-site') return true
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const supplied = new URL(origin).origin
    if (isProductionRuntime()) return supplied !== canonical
    const requestOrigin = request.nextUrl.origin
    return supplied !== requestOrigin && supplied !== canonical
  } catch {
    return true
  }
}

function response(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const expectedOrigin = canonicalOrigin(request)
  if (!expectedOrigin) return response({ error: 'Verification is temporarily unavailable.' }, 503)
  if (invalidOrigin(request, expectedOrigin)) return response({ error: 'Invalid verification origin.' }, 403)

  const rawLength = request.headers.get('content-length')
  if (rawLength && Number(rawLength) > MAX_BODY_BYTES) return response({ error: 'Verification request is too large.' }, 413)

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return response({ error: 'Invalid request.' }, 415)
  }

  const key = clientKey(request)
  if (isRateLimited(key)) return response({ error: 'Too many verification attempts. Please try again later.' }, 429)

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return response({ error: 'Invalid request.' }, 400)
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return response({ error: 'Verification request is too large.' }, 413)

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return response({ error: 'Invalid request.' }, 400)
  }

  const serial = typeof body.serial === 'string' ? body.serial.trim().toUpperCase() : ''
  if (!SERIAL_PATTERN.test(serial)) return response({ error: 'Enter a valid RADVORA serial.' }, 400)

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('public_product_verification')
      .select('serial_number,batch_code,manufactured_at,status,product_name,product_slug,sku')
      .eq('serial_number', serial)
      .maybeSingle()

    if (error) throw error
    return response({ result: data ?? null }, 200)
  } catch (error) {
    console.error('product_verification_failed', error)
    return response({ error: 'Verification is temporarily unavailable. Please try again shortly.' }, 500)
  }
}