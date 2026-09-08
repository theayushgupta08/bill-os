import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  const cookiesToSetList: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToSetList.push({ name, value, options });
            try {
              cookieStore.set(name, value, {
                ...options,
                path: "/",
              });
            } catch {
              // Ignore in environments where setting cookie directly is not permitted
            }
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

    const sessionUser = data.session.user;
    const accessToken = data.session.access_token;

    // Check if user has phone in Supabase user metadata first
    let hasPhone = false;
    if (
      (sessionUser?.phone && sessionUser.phone.trim() !== "") ||
      (sessionUser?.user_metadata?.phone &&
        String(sessionUser.user_metadata.phone).trim() !== "")
    ) {
      hasPhone = true;
    }

    let hasOrganizations = false;
    let primaryOrgId: string | null = null;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://bill-os.onrender.com/api/v1";

      const [userRes, orgsRes] = await Promise.all([
        fetch(`${apiUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
        fetch(`${apiUrl}/organizations`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
      ]);

      if (userRes.ok) {
        const userProfile = await userRes.json();
        if (
          userProfile?.phone &&
          typeof userProfile.phone === "string" &&
          userProfile.phone.trim() !== ""
        ) {
          hasPhone = true;
        }
      }

      if (orgsRes.ok) {
        const orgs = await orgsRes.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          hasOrganizations = true;
          primaryOrgId = orgs[0].id;
        }
      }
    } catch (apiErr) {
      console.warn("Failed to check user/organizations in auth callback:", apiErr);
    }

    let redirectUrl: URL;
    if (!hasPhone) {
      // First-time or OAuth user without phone -> prompt for phone first
      redirectUrl = new URL("/phone", origin);
    } else if (hasOrganizations && primaryOrgId) {
      // Existing user -> sync active_org_id to client and go to dashboard/returnUrl
      const destination =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/dashboard";
      redirectUrl = new URL(
        `/auth/sync?orgId=${encodeURIComponent(primaryOrgId)}&destination=${encodeURIComponent(destination)}`,
        origin
      );
    } else {
      // User has phone but no organizations -> go to setup
      redirectUrl = new URL("/setup", origin);
    }

    // Clone redirect response and ensure all session cookies are explicitly attached with path: "/"
    const finalResponse = NextResponse.redirect(redirectUrl);
    cookiesToSetList.forEach(({ name, value, options }) => {
      finalResponse.cookies.set(name, value, {
        ...options,
        path: "/",
      });
    });

    return finalResponse;
  } catch (err: unknown) {
    console.error("Unhandled error in auth callback route:", err);
    return NextResponse.redirect(
      new URL("/login?error=Unexpected+authentication+error", origin)
    );
  }
}
