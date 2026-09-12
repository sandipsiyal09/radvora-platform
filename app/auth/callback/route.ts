import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

const MAX_AUTH_CODE_LENGTH = 4096

function canonicalOrigin(requestUrl: URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || url.hostname === 'localhost') return url.origin
    } catch {
      // Production callbacks must fail closed below rather than trusting the request host.
    }
  }

  // Preview/development callbacks may use their actual request origin. Production must
  // never derive post-auth redirect trust from a caller-controlled Host header.
  if (process.env.VERCEL_ENV === 'production') return null
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) return null
  return requestUrl.protocol === 'https:' || requestUrl.hostname === 'localhost' ? requestUrl.origin : null
}

function safeDestination(value: string | null, origin: string) {
  if (!value || value.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(value)) return new URL('/account', origin)
  try {
    const destination = new URL(value, origin)
    if (destination.origin !== origin || destination.username || destination.password) return new URL('/account', origin)
    return destination
  } catch {
    return new URL('/account', origin)
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = canonicalOrigin(requestUrl)
  if (!origin) {
    return NextResponse.json(
      { error: 'Authentication callback is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    )
  }

  const code = requestUrl.searchParams.get('code')
  const destination = safeDestination(requestUrl.searchParams.get('next'), origin)

  if (!code || code.length > MAX_AUTH_CODE_LENGTH) {
    return NextResponse.redirect(new URL('/login?error=missing_auth_code', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
  }

  return NextResponse.redirect(destination)
}
