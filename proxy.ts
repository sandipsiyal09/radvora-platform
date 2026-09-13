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
      if (parsed.protocol === 'https:') connectSources.push(`wss://${parsed.host}`)
    } catch {
      // Application health/readiness reports invalid runtime configuration.
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
  return ['/admin', '/account', '/cart', '/checkout', '/login', '/auth/callback', '/security/mfa', '/api'].some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isPrivilegedAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')
}

function isAdminApiPath(pathname: string) {
  return pathname.startsWith('/api/admin/')
}

function applySecurityHeaders(response: NextResponse, request: NextRequest, requestId: string) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy())
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
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

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie)
  return to
}

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()

  if (request.nextUrl.pathname === '/api/webhooks/razorpay' && request.method === 'POST') {
    const contentType = request.headers.get('content-type')?.toLowerCase() || ''
    if (!contentType.startsWith('application/json')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Unsupported webhook media type.' }, { status: 415 }), request, requestId)
    }
    const signature = request.headers.get('x-razorpay-signature')?.trim() || ''
    if (!/^[0-9a-f]{64}$/i.test(signature)) {
      return applySecurityHeaders(NextResponse.json({ error: 'Invalid webhook request.' }, { status: 400 }), request, requestId)
    }
  }

  const buildResponse = () => {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-request-id', requestId)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  let response = buildResponse()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) {
    if (isPrivilegedAdminPath(request.nextUrl.pathname)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Privileged access is temporarily unavailable.' }, { status: 503 }),
        request,
        requestId,
      )
    }
    return applySecurityHeaders(response, request, requestId)
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = buildResponse()
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (isPrivilegedAdminPath(request.nextUrl.pathname)) {
    const apiRequest = isAdminApiPath(request.nextUrl.pathname)
    if (!user) {
      const denied = apiRequest
        ? NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
      return applySecurityHeaders(copyCookies(response, denied), request, requestId)
    }

    const role = String(user.app_metadata?.role || '')
    if (role !== 'admin' && role !== 'founder') {
      const denied = apiRequest
        ? NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
        : NextResponse.redirect(new URL('/account', request.url))
      return applySecurityHeaders(copyCookies(response, denied), request, requestId)
    }

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceError || assurance.currentLevel !== 'aal2') {
      if (apiRequest) {
        return applySecurityHeaders(
          copyCookies(response, NextResponse.json({ error: 'Multi-factor authentication required.' }, { status: 428 })),
          request,
          requestId,
        )
      }
      const destination = new URL('/security/mfa', request.url)
      destination.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
      return applySecurityHeaders(copyCookies(response, NextResponse.redirect(destination)), request, requestId)
    }
  }

  return applySecurityHeaders(response, request, requestId)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
