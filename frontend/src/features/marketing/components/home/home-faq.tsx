import { homeFaqs } from "../../content/faqs";
import { ArrowLink } from "../primitives/button-link";
import { Container, Section, SectionHeading } from "../primitives/layout";
import { FaqList } from "../faq-list";

export function HomeFaq() {
  return (
    <Section aria-labelledby="faq-title">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading id="faq-title" eyebrow="Questions" title="Straight answers." />
            <p className="mt-5 leading-relaxed text-muted-foreground">Something we haven&apos;t covered?</p>
            <ArrowLink href="/contact" className="mt-2">
              Ask us directly
            </ArrowLink>
          </div>
        </div>
        <FaqList items={homeFaqs} className="lg:col-span-8" />
      </Container>
    </Section>
  );
}
