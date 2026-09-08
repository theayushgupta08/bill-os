"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/ui/loader";

function AuthSyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const orgId = searchParams.get("orgId");
    const destination = searchParams.get("destination") || "/dashboard";

    if (orgId && typeof window !== "undefined") {
      localStorage.setItem("active_org_id", orgId);
    }

    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <BrandLoader
        size="xl"
        showBrandText
        text="Entering your workspace"
        variant="card"
      />
    </div>
  );
}

export default function AuthSyncPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <BrandLoader
            size="xl"
            showBrandText
            text="Setting up"
            variant="card"
          />
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
