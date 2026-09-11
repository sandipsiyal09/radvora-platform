import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

function buildContentSecurityPolicy() {
  const connectSources = ["'self'"]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl)
      connectSources.push(parsed.origin)
      if (parsed.protocol === 'https:') {
        connectSources.push(`wss://${parsed.host}`)
      }
    } catch {
      // Ignore an invalid optional runtime URL here; application health/readiness reports config errors.
    }
  }

  const scriptSources = ["'self'", "'unsafe-inline'"]
  if (process.env.NODE_ENV !== 'production') scriptSources.push("'unsafe-eval'")

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ]

  if (process.env.NODE_ENV === 'production') directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

function isPrivateOrApiPath(pathname: string) {
  return ['/admin', '/account', '/cart', '/checkout', '/login', '/auth/callback', '/api'].some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function applySecurityHeaders(response: NextResponse, request: NextRequest, requestId: string) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy())
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Origin-Agent-Cluster', '?1')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('X-Request-ID', requestId)

  if (isPrivateOrApiPath(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  if (request.nextUrl.protocol === 'https:' && process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export async function proxy(request: NextRequest) {
  const suppliedRequestId = request.headers.get('x-request-id')?.trim() || ''
  const requestId = /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : crypto.randomUUID()
  const buildResponse = () => {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-request-id', requestId)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  let response = buildResponse()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    return applySecurityHeaders(response, request, requestId)
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = buildResponse()
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh the auth session when needed. Do not trust cookie presence alone.
  await supabase.auth.getUser()

  return applySecurityHeaders(response, request, requestId)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
