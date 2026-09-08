import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnUrl = requestUrl.searchParams.get("returnUrl");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing+authorization+code", origin)
    );
  }

  // Pre-prepare a response object so we can attach session cookies directly to the redirect
  let redirectUrl = new URL("/setup", origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
      console.error("Server code exchange error:", error);
      const errorMsg = encodeURIComponent(
        error?.message || "Failed to authenticate with Google"
      );
      return NextResponse.redirect(
        new URL(`/login?error=${errorMsg}`, origin)
      );
    }

    const accessToken = data.session.access_token;

    // Check if the user belongs to any organization
    let hasOrganizations = false;
    let primaryOrgId: string | null = null;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://bill-os.onrender.com/api/v1";
      const orgsRes = await fetch(`${apiUrl}/organizations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (orgsRes.ok) {
        const orgs = await orgsRes.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          hasOrganizations = true;
          primaryOrgId = orgs[0].id;
        }
      }
    } catch (apiErr) {
      console.warn("Failed to check organizations in auth callback:", apiErr);
      // Fallback: new user goes to setup
    }

    if (hasOrganizations && primaryOrgId) {
      // Existing user -> sync active_org_id to client and go to dashboard/returnUrl
      const destination =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/dashboard";
      redirectUrl = new URL(
        `/auth/sync?orgId=${encodeURIComponent(primaryOrgId)}&destination=${encodeURIComponent(destination)}`,
        origin
      );
    } else {
      // First-time user -> go to setup
      redirectUrl = new URL("/setup", origin);
    }

    // Clone new response with the final destination while preserving the session cookies
    const finalResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });

    return finalResponse;
  } catch (err: unknown) {
    console.error("Unhandled error in auth callback route:", err);
    return NextResponse.redirect(
      new URL("/login?error=Unexpected+authentication+error", origin)
    );
  }
}
