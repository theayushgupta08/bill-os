import type { ReactNode } from "react";
import { fontDisplay } from "@/features/marketing/fonts";
import { MarketingMotion } from "@/features/marketing/motion";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { cn } from "@/lib/utils";

/** Marketing site. `site-light` scopes the paper/ink theme here; the app itself stays dark-only. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn("site-light flex min-h-dvh flex-col", fontDisplay.variable)}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <MarketingMotion>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
      </MarketingMotion>
    </div>
  );
}
