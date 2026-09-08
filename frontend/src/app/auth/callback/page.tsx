"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api-client";
import { BrandLoader } from "@/components/ui/loader";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    async function handleAuth() {
      const code = searchParams.get("code");
      const returnUrl = searchParams.get("returnUrl");
      const supabase = createClient();

      try {
        let accessToken: string | undefined;

        if (code) {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          accessToken = data.session?.access_token;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            router.replace("/login");
            return;
          }
          accessToken = session.access_token;
        }

        // Check if the user already belongs to an organization
        try {
          const orgs = await api.get<Array<{ id: string }>>("/organizations", {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined,
          });

          if (orgs && orgs.length > 0) {
            localStorage.setItem("active_org_id", orgs[0].id);
            if (returnUrl && returnUrl.startsWith("/")) {
              router.replace(returnUrl);
            } else {
              router.replace("/dashboard");
            }
          } else {
            // First time user -> go to setup
            router.replace("/setup");
          }
        } catch (apiErr) {
          console.error("Failed to query organizations:", apiErr);
          // If organizations API fails or returns empty, assume first time user and go to setup
          router.replace("/setup");
        }
      } catch (err: unknown) {
        console.error("Auth callback error:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to complete Google authentication";
        setError(message);
      }
    }

    handleAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-destructive font-semibold text-lg">
            Authentication Failed
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline underline-offset-4 mt-2"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <BrandLoader
        size="xl"
        showBrandText
        text="Setting up your workspace"
        variant="card"
      />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <BrandLoader size="xl" showBrandText text="Loading" variant="card" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
