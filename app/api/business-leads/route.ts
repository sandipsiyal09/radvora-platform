import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
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
  const source = clean(body.source, 80) || 'website'
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
