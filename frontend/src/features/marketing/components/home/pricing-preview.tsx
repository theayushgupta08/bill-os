import { ArrowLink } from "../primitives/button-link";
import { Container, Section, SectionHeading } from "../primitives/layout";
import { PlanCards } from "../plan-cards";

export function PricingPreview() {
  return (
    <Section tone="sunken" id="pricing" aria-labelledby="pricing-title">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="pricing-title"
            eyebrow="Pricing"
            title="Simple plans, priced in rupees."
            lead="Every plan starts with a free trial. Move up when your team or your warehouses grow."
          />
          <ArrowLink href="/pricing" className="shrink-0">
            Compare every feature
          </ArrowLink>
        </div>
        <PlanCards className="mt-12" />
      </Container>
    </Section>
  );
}
