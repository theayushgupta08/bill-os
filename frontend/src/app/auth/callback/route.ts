import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnUrl = requestUrl.searchParams.get("returnUrl");
  const source = requestUrl.searchParams.get("source");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing+authorization+code", origin)
    );
  }

  const cookieStore = await cookies();
  const cookiesToSetList: { name: string; value: string; options?: CookieOptions }[] = [];

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
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://bill-os.onrender.com/api/v1";

    // Option C: If signing in via Google from the login page, verify user exists in billOS
    if (source === "login" && sessionUser?.email) {
      try {
        // Sends the token (not a bare email) so the backend only answers for the caller's own verified email.
        const checkRes = await fetch(`${apiUrl}/public/check-user-exists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
          cache: "no-store",
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData?.exists) {
            await supabase.auth.signOut();
            const errorMsg = encodeURIComponent(
              "No billOS account found with this Google email. If you are a staff member, please log in with your assigned team email and password."
            );
            return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, origin));
          }
        }
      } catch (checkErr) {
        console.warn("Failed to check user existence in Google login:", checkErr);
      }
    }

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
    let mustChangePassword = false;

    try {
      const [userRes, orgsRes, pwdRes] = await Promise.all([
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
        fetch(`${apiUrl}/users/me/must-change-password`, {
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

      if (pwdRes.ok) {
        const pwdData = await pwdRes.json();
        if (pwdData?.mustChangePassword) {
          mustChangePassword = true;
        }
      }
    } catch (apiErr) {
      console.warn("Failed to check user/organizations in auth callback:", apiErr);
    }

    let redirectUrl: URL;
    if (mustChangePassword) {
      // Force user to change password before anything else
      redirectUrl = new URL("/change-password", origin);
    } else if (!hasPhone) {
      // First-time or OAuth user without phone -> prompt for phone first.
      const phoneUrl = returnUrl && returnUrl.startsWith("/")
        ? `/phone?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/phone";
      redirectUrl = new URL(phoneUrl, origin);
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
