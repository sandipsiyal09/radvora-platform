import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BODY_BYTES = 8 * 1024
const ALLOWED_SOURCES = new Set(['business-page','dealer-page','distributor-page','contact-page','privacy-page','website'])

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function canonicalOrigin(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || url.hostname === 'localhost') return url.origin
    } catch {
      // Production public mutations fail closed below instead of trusting request.nextUrl.
    }
  }
  if (process.env.VERCEL_ENV === 'production') return null
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) return null
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
  if (!expectedOrigin) return response({ error: 'Enquiry service is temporarily unavailable.' }, 503)
  if (invalidOrigin(request, expectedOrigin)) {
    return response({ error: 'Invalid enquiry origin.' }, 403)
  }

  const rawLength = request.headers.get('content-length')
  if (rawLength && Number(rawLength) > MAX_BODY_BYTES) {
    return response({ error: 'Enquiry is too large.' }, 413)
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

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return response({ error: 'Invalid request.' }, 400)
  }

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
  const segment = source === 'privacy-page' ? 'privacy' : 'business'
  const notes = clean(body.notes, 3000)

  if (fullName.length < 2 || !EMAIL_PATTERN.test(email)) {
    return response({ error: 'Please provide a valid name and email address.' }, 400)
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
      full_name: fullName,
      email,
      phone: phone || null,
      company: company || null,
      source,
      segment,
      status: 'new',
      score: 0,
      notes: notes || null,
    })

    if (error) throw error
    return response({ ok: true }, 201)
  } catch (error) {
    console.error('business_lead_submission_failed', error)
    return response({ error: 'We could not submit your enquiry. Please try again shortly.' }, 500)
  }
}