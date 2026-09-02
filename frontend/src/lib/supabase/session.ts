import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Refreshes the Supabase session for an incoming request.
 *
 * Access tokens are short-lived, so without this running on every request a user sitting on a page
 * would silently lose their session and every API call would start 401-ing. Calling `getUser()`
 * validates the token against Supabase and rotates the auth cookies when it is close to expiry.
 *
 * The returned `response` carries those refreshed cookies and MUST be the one sent to the browser —
 * see `applySessionCookies` when the caller needs to redirect instead.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Must be getUser(), not getSession(): only getUser() re-validates the JWT with the auth server.
  // getSession() trusts the cookie, which cannot be trusted in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}

/**
 * Copies the refreshed auth cookies from `source` onto a different response.
 *
 * Needed whenever the proxy answers with a redirect: the redirect is a brand-new response and would
 * otherwise drop the rotated tokens, logging the user out on the next hop.
 */
export function applySessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}
