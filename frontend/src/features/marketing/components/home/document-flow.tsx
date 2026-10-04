"use client";

import { useRef, type ReactNode } from "react";
import { type MotionValue, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { Container, SectionHeading } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";
import { StatusPill } from "../primitives/status-pill";

interface Step {
  title: string;
  body: string;
  slip: ReactNode;
}

// Every step here is real behaviour: issuing deducts stock per line and raises the customer's
// outstanding balance; payments allocate to invoices (PARTIAL → PAID); GST returns count issued only.
const steps: Step[] = [
  {
    title: "You issue the invoice",
    body: "Tax is worked out on every line — CGST and SGST or IGST — and rounded to the paisa.",
    slip: (
      <>
        <SlipRow label="INV-0046" value={<StatusPill status="issued">Issued</StatusPill>} />
        <SlipFigure>₹25,488.00</SlipFigure>
      </>
    ),
  },
  {
    title: "Stock moves out",
    body: "Each line deducts its quantity from the warehouse it ships from. No second entry.",
    slip: (
      <>
        <SlipRow label="LED panel 18 W" value="Pune WH" />
        <SlipFigure>
          120 <span className="text-subtle">→</span> 96
        </SlipFigure>
      </>
    ),
  },
  {
    title: "The customer owes you",
    body: "The total lands on the customer's outstanding balance and in your receivables report.",
    slip: (
      <>
        <SlipRow label="Sharma Traders" value="Receivable" />
        <SlipFigure>₹25,488.00</SlipFigure>
      </>
    ),
  },
  {
    title: "Payments settle it",
    body: "Record UPI, cash or bank receipts and allocate them to invoices. Partial, then paid.",
    slip: (
      <>
        <SlipRow label="UPI · ₹15,000" value={<StatusPill status="partial">Partial</StatusPill>} />
        <SlipFigure>₹10,488.00 due</SlipFigure>
      </>
    ),
  },
  {
    title: "Returns pick it up",
    body: "GSTR-1, GSTR-3B, the HSN summary and P&L include it. Drafts and voids never do.",
    slip: (
      <>
        <SlipRow label="GSTR-1 · Oct" value="B2B" />
        <SlipFigure>₹3,888.00 tax</SlipFigure>
      </>
    ),
  },
];

export function DocumentFlow() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 80%", "end 55%"] });
  const complete = useMotionValue(1);
  // Scroll-linked values bypass MotionConfig's reducedMotion, so opt out explicitly
  const progress = reduce ? complete : scrollYProgress;

  return (
    <section id="how-it-works" aria-labelledby="flow-title" className="border-t border-border py-20 sm:py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="flow-title"
          eyebrow="How it works"
          title="Issue one invoice. Every ledger agrees."
          lead="Most businesses re-type the same sale into a stock register, a receivables sheet and a GST workbook. Here it's one action, and everything downstream updates on its own."
        />

        <ol ref={listRef} className="relative mt-16 grid gap-10 pl-8 lg:mt-20 lg:grid-cols-5 lg:gap-6 lg:pt-10 lg:pl-0">
          {/* Track + scroll-drawn progress: vertical on phones, horizontal from lg */}
          <span aria-hidden className="absolute top-1 bottom-1 left-[5px] w-px bg-border lg:top-[5px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto" />
          <m.span
            aria-hidden
            style={{ scaleY: progress }}
            className="absolute top-1 bottom-1 left-[5px] w-px origin-top bg-primary lg:hidden"
          />
          <m.span
            aria-hidden
            style={{ scaleX: progress }}
            className="absolute top-[5px] right-0 left-0 hidden h-px origin-left bg-primary lg:block"
          />

          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <Marker progress={progress} at={index / (steps.length - 1)} />
              <Reveal delay={index * 0.06}>
                <p className="font-mono text-xs text-subtle">0{index + 1}</p>
                <div className="mt-3 rounded-[10px] border border-border bg-card px-3.5 py-3 shadow-[0_1px_0_rgb(14_26_51/0.04)]">
                  {step.slip}
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** Dot on the track that fills as the drawn line reaches it. */
function Marker({ progress, at }: { progress: MotionValue<number>; at: number }) {
  const fill = useTransform(progress, [Math.max(0, at - 0.04), at], [0, 1]);
  return (
    <span
      aria-hidden
      className="absolute top-1 -left-8 size-[11px] rounded-full border border-rule-strong bg-background lg:-top-10 lg:left-0"
    >
      <m.span style={{ opacity: fill }} className="absolute -inset-px rounded-full bg-primary" />
    </span>
  );
}

function SlipRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="truncate font-mono text-muted-foreground">{label}</span>
      {typeof value === "string" ? <span className="shrink-0 text-subtle">{value}</span> : value}
    </div>
  );
}

function SlipFigure({ children }: { children: ReactNode }) {
  return <p className="mt-2 font-mono text-[0.9375rem] font-medium tabular-nums text-foreground">{children}</p>;
}
