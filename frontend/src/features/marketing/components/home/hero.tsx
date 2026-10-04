import { CenteredHero, HeroAnnouncement } from "@/components/ui/saa-s-template";
import { siteConfig } from "@/lib/config";
import { ButtonLink } from "../primitives/button-link";
import { HeroInvoice } from "./hero-invoice";

/**
 * Centered hero: announcement, headline, calls to action, then the live invoice demo as the product preview.
 * Server-rendered copy so the headline (the LCP element) paints without waiting for JS; only the invoice is a
 * client island.
 */
export function Hero() {
  return (
    <CenteredHero
      titleId="hero-title"
      className="pt-12 pb-20 sm:pt-16 lg:pt-20 lg:pb-28"
      announcement={
        <HeroAnnouncement href="/features#reports" linkLabel="See reports">
          New: GSTR-3B now sets off ITC head by head.
        </HeroAnnouncement>
      }
      title="Billing, stock and GST that finally add up."
      description={
        <>
          {siteConfig.name} is the back office for Indian businesses. Raise GST invoices, track stock across
          warehouses, collect payments in the field and keep GSTR-1 and 3B ready for your CA — in one set of books.
        </>
      }
      actions={
        <>
          <ButtonLink href="/register" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href="#how-it-works" size="lg" variant="secondary">
            See how it works
          </ButtonLink>
        </>
      }
      footnote={`${siteConfig.policies.freeTrialDays}-day free trial. No credit card needed.`}
      backdrop={
        // Ledger ruling behind the invoice — faint, decorative, masked so it never competes with the document
        <div className="size-full bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--border)_31px,var(--border)_32px)] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]" />
      }
      preview={<HeroInvoice />}
    />
  );
}
