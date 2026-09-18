import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BODY_BYTES = 8 * 1024
const ALLOWED_SOURCES = new Set(['business-page','dealer-page','distributor-page','contact-page','privacy-page','shieldlab-interest','product-interest','website'])

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
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
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

export async function POST(request: NextRequest) {
  const expectedOrigin = canonicalOrigin(request)
  if (!expectedOrigin) return response({ error: 'Enquiry service is temporarily unavailable.' }, 503)
  if (invalidOrigin(request, expectedOrigin)) {
    return response({ error: 'Invalid enquiry origin.' }, 403)
  }

  const rawLength = request.headers.get('content-length')
  if (rawLength) {
    const declaredLength = Number(rawLength)
    if (!Number.isFinite(declaredLength) || declaredLength < 0) {
      return response({ error: 'Invalid request.' }, 400)
    }
    if (declaredLength > MAX_BODY_BYTES) {
      return response({ error: 'Enquiry is too large.' }, 413)
    }
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return response({ error: 'Invalid request.' }, 415)
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return response({ error: 'Invalid request.' }, 400)
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return response({ error: 'Enquiry is too large.' }, 413)
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return response({ error: 'Invalid request.' }, 400)
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return response({ error: 'Invalid request.' }, 400)
  }
  const body = parsedBody as Record<string, unknown>

  // Honeypot: legitimate clients leave this field empty.
  if (clean(body.website, 200)) {
    return response({ ok: true }, 200)
  }

  const fullName = clean(body.name, 120)
  const email = clean(body.email, 320).toLowerCase()
  const phone = clean(body.phone, 40)
  const company = clean(body.company, 160)
  const requestedSource = clean(body.source, 80) || 'website'
  const source = ALLOWED_SOURCES.has(requestedSource) ? requestedSource : 'website'
  const consumerInterest = source === 'shieldlab-interest' || source === 'product-interest'
  const segment = source === 'privacy-page' ? 'privacy' : consumerInterest ? 'consumer_interest' : 'business'
  const context = clean(body.context, 240)
  const notes = consumerInterest
    ? (context ? `Availability interest · ${context} · explicit email consent` : 'Availability interest · explicit email consent')
    : clean(body.notes, 3000)

  if (consumerInterest && body.consent !== true) {
    return response({ error: 'Please confirm that you want the requested availability email.' }, 400)
  }
  if (!EMAIL_PATTERN.test(email) || (!consumerInterest && fullName.length < 2)) {
    return response({ error: consumerInterest ? 'Please provide a valid email address.' : 'Please provide a valid name and email address.' }, 400)
  }

  try {
    const supabase = createAdminClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourAgo)

    if (countError) throw countError
    if ((count ?? 0) >= 3) {
      return response({ error: 'Too many recent enquiries. Please try again later.' }, 429)
    }

    const { error } = await supabase.from('leads').insert({
      full_name: fullName || null,
      email,
      phone: consumerInterest ? null : phone || null,
      company: consumerInterest ? null : company || null,
      source,
      segment,
      status: 'new',
      score: 0,
      notes: notes || null,
    })

    if (error) throw error
    return response({ ok: true }, 201)
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'unknown_error'
    console.error('business_lead_submission_failed', { component: 'leads', errorName })
    return response({ error: 'We could not submit your enquiry. Please try again shortly.' }, 500)
  }
}
