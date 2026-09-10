import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNext(requestUrl.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_auth_code', requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin))
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
