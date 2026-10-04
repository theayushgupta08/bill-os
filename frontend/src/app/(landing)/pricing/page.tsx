import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { pricingFaqs } from "@/features/marketing/content/faqs";
import { ComparisonTable } from "@/features/marketing/components/comparison-table";
import { CtaBand } from "@/features/marketing/components/cta-band";
import { FaqList } from "@/features/marketing/components/faq-list";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { PlanCards } from "@/features/marketing/components/plan-cards";
import { Container, Section, SectionHeading } from "@/features/marketing/components/primitives/layout";

export const metadata: Metadata = {
  title: `Pricing | ${siteConfig.name}`,
  description: `Simple plans in rupees, each with a ${siteConfig.policies.freeTrialDays}-day free trial. No setup fees.`,
};

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Simple plans, priced in rupees."
        lead={`Start with a ${siteConfig.policies.freeTrialDays}-day free trial — no card needed. Move up when your team or your warehouses grow.`}
      >
        <PlanCards className="mt-12" />
      </PageIntro>

      <Section aria-labelledby="compare-title">
        <Container>
          <SectionHeading id="compare-title" eyebrow="Compare" title="What's in each plan." />
          <div className="mt-10">
            <ComparisonTable />
          </div>
        </Container>
      </Section>

      <Section tone="sunken" aria-labelledby="pricing-faq-title">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading id="pricing-faq-title" eyebrow="Questions" title="About billing." />
          </div>
          <FaqList items={pricingFaqs} className="lg:col-span-8" />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
