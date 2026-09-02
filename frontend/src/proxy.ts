import { NextResponse, type NextRequest } from 'next/server'
import { applySessionCookies, updateSession } from '@/lib/supabase/session'

/**
 * Next.js proxy (the Next 16 name for middleware).
 *
 * Two jobs, both of which have to happen on every request:
 *  1. Refresh the Supabase session so access tokens do not expire under the user.
 *  2. Gate access — the app is fail-closed, so any route not listed below is protected.
 */

/**
 * Routes reachable without a session. Everything else requires one, so adding a new dashboard page
 * cannot accidentally ship unauthenticated.
 */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/auth', // Supabase email-confirmation and OAuth callbacks
  '/about',
  '/contact',
  '/features',
  '/pricing',
  '/privacy',
  '/refund',
  '/security',
  '/terms',
]

/** Signed-in users have no reason to see these and get bounced to the dashboard. */
const AUTH_ROUTES = ['/login', '/register']

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the destination so the user lands where they were headed after signing in.
    loginUrl.searchParams.set('returnUrl', `${pathname}${search}`)
    return applySessionCookies(response, NextResponse.redirect(loginUrl))
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    // Respect an explicit returnUrl (e.g. arriving from an invitation link) over the default.
    const returnUrl = request.nextUrl.searchParams.get('returnUrl')
    const destination = returnUrl?.startsWith('/') ? returnUrl : '/dashboard'
    return applySessionCookies(response, NextResponse.redirect(new URL(destination, request.url)))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets — those do not need a session refresh and
     * running on them would triple the auth traffic for no benefit.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}
