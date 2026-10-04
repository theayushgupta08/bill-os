import { siteConfig } from "@/lib/config";
import { ButtonLink } from "./primitives/button-link";
import { Container, Section } from "./primitives/layout";

interface CtaBandProps {
  title?: string;
  body?: string;
}

/** Closing call to action used at the foot of every marketing page. */
export function CtaBand({
  title = "Send your first GST invoice today.",
  body = `Set up your organisation, add a customer and issue an invoice in one sitting. ${siteConfig.policies.freeTrialDays}-day free trial, no card needed.`,
}: CtaBandProps) {
  return (
    <Section tone="inverse" flush aria-labelledby="cta-title" className="py-20 sm:py-24">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2
            id="cta-title"
            className="font-display text-[clamp(2.125rem,1.5rem+2.4vw,3.25rem)] leading-[1.06] font-normal tracking-[-0.02em] text-balance text-foreground"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            Talk to us
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
