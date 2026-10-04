import type { ReactNode } from "react";
import { Container, SectionHeading } from "./primitives/layout";

interface PageIntroProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}

/** Opening block for inner pages: the page's single h1, on paper, closed by a hairline. */
export function PageIntro({ eyebrow, title, lead, children }: PageIntroProps) {
  return (
    <section className="border-b border-border pt-12 pb-14 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20">
      <Container>
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} lead={lead} />
        {children}
      </Container>
    </section>
  );
}
