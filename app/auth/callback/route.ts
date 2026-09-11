import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

function canonicalOrigin(requestUrl: URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!configured) return requestUrl.origin
  try {
    const url = new URL(configured)
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url.origin : requestUrl.origin
  } catch {
    return requestUrl.origin
  }
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
  const code = requestUrl.searchParams.get('code')
  const destination = safeDestination(requestUrl.searchParams.get('next'), origin)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_auth_code', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
  }

  return NextResponse.redirect(destination)
}
