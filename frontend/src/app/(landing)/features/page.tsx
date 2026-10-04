import type { Metadata } from "next";
import { Check } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { CtaBand } from "@/features/marketing/components/cta-band";
import { productModules } from "@/features/marketing/components/modules";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { ArrowLink } from "@/features/marketing/components/primitives/button-link";
import { Container, Eyebrow } from "@/features/marketing/components/primitives/layout";
import { Reveal } from "@/features/marketing/components/primitives/reveal";

export const metadata: Metadata = {
  title: `Features | ${siteConfig.name}`,
  description:
    "GST billing, stock and purchases, field collections, reports and team roles — what BillOS does today, module by module.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="One set of books for the whole business."
        lead={`Here's what ${siteConfig.name} does today, module by module. If it's on this page, it's in the product.`}
      >
        <nav aria-label="Modules" className="-mx-5 mt-10 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {productModules.map((module) => (
              <li key={module.id}>
                <a
                  href={`#${module.id}`}
                  className="inline-flex h-10 items-center rounded-full border border-input bg-card px-4 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:border-rule-strong hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {module.tab}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageIntro>

      {productModules.map((module, index) => {
        const flipped = index % 2 === 1;
        return (
          <section
            key={module.id}
            id={module.id}
            aria-labelledby={`${module.id}-title`}
            className={cn("py-20 sm:py-24 lg:py-28", flipped && "bg-sunken")}
          >
            <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className={cn("lg:col-span-5", flipped && "lg:order-last")}>
                <Eyebrow>
                  0{index + 1} · {module.tab}
                </Eyebrow>
                <h2
                  id={`${module.id}-title`}
                  className="mt-5 font-display text-[clamp(2rem,1.5rem+1.8vw,2.75rem)] leading-[1.08] font-normal tracking-[-0.018em] text-balance text-foreground"
                >
                  {module.title}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{module.summary}</p>
                <ul className="mt-8 space-y-3.5">
                  {module.details.map((detail) => (
                    <li key={detail} className="flex gap-3 text-foreground">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-positive" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal className="lg:col-span-7">
                <module.Panel />
              </Reveal>
            </Container>
          </section>
        );
      })}

      <section aria-labelledby="next-title" className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="grid gap-8 rounded-[14px] border border-dashed border-rule-strong p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-8">
              <p className="inline-flex items-center gap-2 rounded-full bg-warning-tint px-2.5 py-1 text-xs font-medium text-warning">
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
                In development · not available yet
              </p>
              <h2
                id="next-title"
                className="mt-5 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.375rem)] leading-tight font-normal tracking-[-0.015em] text-foreground"
              >
                An assistant that knows your books.
              </h2>
              <p className="mt-4 max-w-[60ch] leading-relaxed text-muted-foreground">
                Ask &ldquo;who owes me the most this month?&rdquo; or &ldquo;what sold best in Pune?&rdquo; in plain
                language and get the answer from your own data. We&apos;re building it now, and we&apos;ll say so
                here when you can use it.
              </p>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <ArrowLink href="/contact">Ask for early access</ArrowLink>
            </div>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
