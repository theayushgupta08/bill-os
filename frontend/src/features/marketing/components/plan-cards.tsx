"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANNUAL_SAVING_LABEL, plans, type BillingCycle, type Plan } from "../content/plans";
import { formatRupees } from "../format";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { ButtonLink } from "./primitives/button-link";

export function PlanCards({ className }: { className?: string }) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");

  return (
    <div className={className}>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Billing cycle"
          className="relative grid grid-cols-2 rounded-[10px] border border-input bg-card p-1"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-foreground transition-transform duration-300 ease-ledger motion-reduce:transition-none",
              cycle === "annual" && "translate-x-full"
            )}
          />
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={cycle === option}
              onClick={() => setCycle(option)}
              className={cn(
                "relative z-10 h-10 cursor-pointer rounded-md px-5 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                cycle === option ? "text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-positive">{ANNUAL_SAVING_LABEL}</span> with yearly billing. Prices exclude GST.
        </p>
      </div>

      <ul className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-5">
        {plans.map((plan) => (
          <li key={plan.id} className="flex">
            <PlanCard plan={plan} cycle={cycle} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const featured = plan.recommended;
  const price = plan.price?.[cycle];

  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex w-full flex-col rounded-[14px] border p-6 sm:p-7",
        featured ? "tone-inverse border-transparent bg-background text-foreground shadow-float" : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`plan-${plan.id}`} className="text-lg font-semibold text-foreground">
          {plan.name}
        </h3>
        {featured && (
          <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-link">Most teams pick this</span>
        )}
      </div>
      <p className="mt-2 min-h-12 text-[0.9375rem] leading-relaxed text-muted-foreground">{plan.summary}</p>

      <div className="mt-6 flex h-14 items-end gap-1.5">
        {price === undefined ? (
          <p className="font-display text-[2.5rem] leading-none tracking-[-0.02em] text-foreground">Let&apos;s talk</p>
        ) : (
          <>
            <span className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={price}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  className="block font-mono text-[2.5rem] leading-none font-medium tracking-[-0.03em] tabular-nums text-foreground"
                >
                  {formatRupees(price)}
                </m.span>
              </AnimatePresence>
            </span>
            <span className="pb-1 text-sm text-muted-foreground">/ month</span>
          </>
        )}
      </div>
      <p className="mt-2 h-5 text-xs text-subtle">
        {price === undefined
          ? "Priced for your warehouses and team"
          : cycle === "annual"
            ? `Billed yearly at ${formatRupees(price * 12)}`
            : "Billed every month"}
      </p>

      <ButtonLink
        href={plan.cta.href}
        variant={featured ? "primary" : "secondary"}
        arrow={featured}
        className="mt-6 w-full"
      >
        {plan.cta.label}
      </ButtonLink>

      <ul className="mt-7 space-y-3 border-t border-border pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-[0.9375rem] text-foreground">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}
