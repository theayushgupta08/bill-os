import { siteConfig } from "@/lib/config";
import { ButtonLink } from "../primitives/button-link";
import { Container, Eyebrow } from "../primitives/layout";
import { HeroInvoice } from "./hero-invoice";

/**
 * Server-rendered copy so the headline (the LCP element) paints without waiting for JS; only the
 * invoice on the right is a client island.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-14 lg:pt-20 lg:pb-32" aria-labelledby="hero-title">
      {/* Ledger ruling behind the invoice — faint, decorative, masked so it never competes with text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--border)_31px,var(--border)_32px)] [mask-image:radial-gradient(ellipse_70%_60%_at_60%_45%,black,transparent)] lg:block"
      />

      <Container className="relative grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 xl:col-span-6 xl:pr-6">
          <Eyebrow>GST billing · Stock · Accounts</Eyebrow>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(2.75rem,1.55rem+4.6vw,4.75rem)] leading-[1.02] font-normal tracking-[-0.025em] text-balance text-foreground"
          >
            Billing, stock and GST that finally add up.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-[1.1875rem]">
            {siteConfig.name} is the back office for Indian businesses. Raise GST invoices, track stock across
            warehouses, collect payments in the field and keep GSTR-1 and 3B ready for your CA — in one set of books.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg" arrow>
              Start free trial
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="secondary">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm text-subtle">
            {siteConfig.policies.freeTrialDays}-day free trial. No credit card needed.
          </p>
        </div>

        <div className="lg:col-span-6 lg:pl-4 xl:pl-8">
          <HeroInvoice />
        </div>
      </Container>
    </section>
  );
}
