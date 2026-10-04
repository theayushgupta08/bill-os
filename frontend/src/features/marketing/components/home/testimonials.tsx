"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { sampleTestimonials, testimonials } from "../../content/testimonials";
import { Container, Section, SectionHeading } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";
import { StatusPill } from "../primitives/status-pill";

// Real quotes when there are any. The invented samples appear only in development, so they can never ship as
// reviews; with neither, the section renders nothing.
const showingSamples = testimonials.length === 0 && process.env.NODE_ENV === "development";
const quotes: Testimonial[] = testimonials.length > 0 ? testimonials : showingSamples ? sampleTestimonials : [];

// Three columns at different speeds; the 2nd and 3rd appear from md and lg up
const columns = [
  { offset: 0, duration: 15, className: "" },
  { offset: 1, duration: 19, className: "hidden md:block" },
  { offset: 2, duration: 17, className: "hidden lg:block" },
]
  .map((column) => ({ ...column, quotes: quotes.filter((_, index) => index % 3 === column.offset) }))
  .filter((column) => column.quotes.length > 0);

export function Testimonials() {
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  if (quotes.length === 0) return null;

  return (
    <Section tone="sunken" aria-labelledby="testimonials-title" className="overflow-hidden">
      <Container>
        <Reveal>
          <SectionHeading
            id="testimonials-title"
            eyebrow="Customers"
            title="What businesses say about billOS."
            lead="Owners, accountants and sales teams on running their books in one place."
            align="center"
          />
          {showingSamples && (
            <p className="mt-5 flex justify-center">
              <StatusPill status="issued">Sample quotes — shown in development only</StatusPill>
            </p>
          )}
        </Reveal>

        <div className="mt-14 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          {columns.map((column) => (
            <TestimonialsColumn
              key={column.offset}
              testimonials={column.quotes}
              duration={column.duration}
              paused={paused}
              className={column.className}
            />
          ))}
        </div>

        {/* Moving content needs a way to stop it (WCAG 2.2.2); reduced-motion users never see it move */}
        {!reduceMotion && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
              {paused ? "Play testimonials" : "Pause testimonials"}
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
}
