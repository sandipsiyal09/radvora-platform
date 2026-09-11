import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BODY_BYTES = 8 * 1024
const ALLOWED_SOURCES = new Set(['business-page','dealer-page','distributor-page','contact-page','website'])

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function invalidOrigin(request: NextRequest) {
  if (request.headers.get('sec-fetch-site')?.toLowerCase() === 'cross-site') return true
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const supplied = new URL(origin).origin
    const requestOrigin = request.nextUrl.origin
    const configured = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : requestOrigin
    return supplied !== requestOrigin && supplied !== configured
  } catch {
    return true
  }
}

export async function POST(request: NextRequest) {
  if (invalidOrigin(request)) {
    return NextResponse.json({ error: 'Invalid enquiry origin.' }, { status: 403 })
  }

  const rawLength = request.headers.get('content-length')
  if (rawLength && Number(rawLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Enquiry is too large.' }, { status: 413 })
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Enquiry is too large.' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: legitimate clients leave this field empty.
  if (clean(body.website, 200)) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const fullName = clean(body.name, 120)
  const email = clean(body.email, 320).toLowerCase()
  const phone = clean(body.phone, 40)
  const company = clean(body.company, 160)
  const requestedSource = clean(body.source, 80) || 'website'
  const source = ALLOWED_SOURCES.has(requestedSource) ? requestedSource : 'website'
  const notes = clean(body.notes, 3000)

  if (fullName.length < 2 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid name and email address.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Too many recent enquiries. Please try again later.' }, { status: 429 })
    }

    const { error } = await supabase.from('leads').insert({
      full_name: fullName,
      email,
      phone: phone || null,
      company: company || null,
      source,
      segment: 'business',
      status: 'new',
      score: 0,
      notes: notes || null,
    })

    if (error) throw error
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('business_lead_submission_failed', error)
    return NextResponse.json({ error: 'We could not submit your enquiry. Please try again shortly.' }, { status: 500 })
  }
}
