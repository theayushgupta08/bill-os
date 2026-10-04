"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { PackageMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "../../format";
import { DURATION, EASE_OUT } from "../../motion-tokens";
import { StatusPill } from "../primitives/status-pill";

const LINES = [
  { item: "LED panel 18 W", hsn: "9405", qty: 24, rate: 420 },
  { item: "Copper wire 1.5 mm², 90 m", hsn: "8544", qty: 6, rate: 1350 },
  { item: "MCB 32 A, double pole", hsn: "8536", qty: 12, rate: 285 },
];
const GST_RATE = 18;

const SUPPLY = {
  intra: { state: "Maharashtra", code: "27", address: "Laxmi Road, Pune", gstin: "27AAPFS6120K1ZQ" },
  inter: { state: "Karnataka", code: "29", address: "SP Road, Bengaluru", gstin: "29AAPFS6120K1ZW" },
} as const;
type Supply = keyof typeof SUPPLY;

const taxable = LINES.reduce((sum, line) => sum + line.qty * line.rate, 0);
const tax = Math.round(taxable * GST_RATE) / 100;
// Mirrors the backend's TaxMath: CGST is half (2 dp), SGST is the remainder, so the halves always add up
const cgst = Math.round((tax / 2) * 100) / 100;
const sgst = Math.round((tax - cgst) * 100) / 100;
const total = taxable + tax;

/** Seconds after mount at which the example invoice is "issued" and stock moves. */
const ISSUE_AT = 1.4;

/**
 * The hero's working example of billOS's tax logic. The visitor flips the customer's state and sees
 * CGST + SGST collapse into IGST while the total stays put — the same rule the backend applies.
 */
export function HeroInvoice() {
  const reduce = useReducedMotion();
  const [supply, setSupply] = useState<Supply>("intra");
  const [issueElapsed, setIssueElapsed] = useState(false);
  const [touched, setTouched] = useState(false);
  const buyer = SUPPLY[supply];
  // Reduced motion skips the little story and shows the issued state straight away
  const issued = reduce || issueElapsed;

  // The invoice arrives as a draft (CSS entrance, no JS needed), then gets issued and stock is deducted
  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setIssueElapsed(true), ISSUE_AT * 1000);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const choose = (next: Supply) => {
    setTouched(true);
    setSupply(next);
  };

  return (
    <div className="relative">
      <figure
        aria-label="Example GST invoice"
        className="relative animate-rise rounded-[14px] border border-border bg-card shadow-paper motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-subtle">Tax invoice</p>
            <p className="mt-2 font-semibold text-foreground">Kaveri Electricals</p>
            <p className="mt-0.5 font-mono text-[0.6875rem] text-subtle">GSTIN 27AAGCK4821M1Z3</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-medium text-foreground">INV-0046</p>
            <p className="mt-1 text-xs text-subtle">04 Oct 2026</p>
            <div className="mt-2 h-5">
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={issued ? "issued" : "draft"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, transition: { duration: DURATION.fast } }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  className="inline-block"
                >
                  {issued ? <StatusPill status="issued">Issued</StatusPill> : <StatusPill status="draft">Draft</StatusPill>}
                </m.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Parties + place of supply */}
        <div className="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-end sm:px-7">
          <div className="min-w-0">
            <p className="text-xs text-subtle">Bill to</p>
            <p className="mt-1 text-sm font-medium text-foreground">Sharma Traders</p>
            <p className="text-xs text-muted-foreground">
              {buyer.address}, {buyer.state}
            </p>
            <p className="mt-0.5 font-mono text-[0.6875rem] text-subtle">GSTIN {buyer.gstin}</p>
          </div>
          <div>
            <p id="supply-label" className="mb-1.5 text-xs text-subtle">
              Place of supply <span className="text-link">— try it</span>
            </p>
            <div
              role="group"
              aria-labelledby="supply-label"
              className="relative grid grid-cols-2 rounded-lg border border-input bg-sunken p-0.5"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-card shadow-[0_1px_2px_rgb(14_26_51/0.12)] transition-transform duration-300 ease-ledger motion-reduce:transition-none",
                  supply === "inter" && "translate-x-full"
                )}
              />
              {(Object.keys(SUPPLY) as Supply[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={supply === key}
                  onClick={() => choose(key)}
                  className={cn(
                    "relative z-10 h-10 cursor-pointer rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 sm:h-8",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    supply === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {SUPPLY[key].state} <span className="font-mono text-subtle">({SUPPLY[key].code})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lines */}
        <table className="w-full text-sm">
          <caption className="sr-only">Invoice lines</caption>
          <thead>
            <tr className="text-left text-xs text-subtle">
              <th scope="col" className="py-2.5 pl-5 font-normal sm:pl-7">Item</th>
              <th scope="col" className="py-2.5 pr-3 text-right font-normal">Qty</th>
              <th scope="col" className="hidden py-2.5 pr-3 text-right font-normal sm:table-cell">Rate</th>
              <th scope="col" className="py-2.5 pr-5 text-right font-normal sm:pr-7">Amount</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map((line, index) => (
              <tr
                key={line.item}
                style={{ animationDelay: `${250 + index * 80}ms` }}
                className="animate-fade border-t border-border/70 align-top motion-reduce:animate-none"
              >
                <td className="py-2.5 pl-5 sm:pl-7">
                  <span className="text-foreground">{line.item}</span>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-subtle">HSN {line.hsn}</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-muted-foreground">{line.qty}</td>
                <td className="hidden py-2.5 pr-3 text-right font-mono tabular-nums text-muted-foreground sm:table-cell">
                  {formatAmount(line.rate)}
                </td>
                <td className="py-2.5 pr-5 text-right font-mono tabular-nums text-foreground sm:pr-7">
                  {formatAmount(line.qty * line.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-border px-5 py-4 sm:px-7">
          <div className="ml-auto max-w-[17rem] space-y-1.5 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Taxable value</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatAmount(taxable)}
              </span>
            </div>

            {/* Fixed height for two rows, so switching to a single IGST row doesn't shift the layout */}
            <div className="h-[3.25rem]">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={supply}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  className="space-y-1.5"
                >
                  {supply === "intra" ? (
                    <>
                      <TaxRow label={`CGST ${GST_RATE / 2}%`} value={cgst} />
                      <TaxRow label={`SGST ${GST_RATE / 2}%`} value={sgst} />
                    </>
                  ) : (
                    <TaxRow label={`IGST ${GST_RATE}%`} value={tax} />
                  )}
                </m.div>
              </AnimatePresence>
            </div>

            <div className="flex items-baseline justify-between gap-6 border-t border-border pt-2.5">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                ₹{formatAmount(total)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-pretty text-subtle sm:text-right">
            {supply === "intra"
              ? "Same state as the seller, so tax splits into CGST + SGST."
              : "Different state, so it's IGST. The total doesn't change."}
          </p>
        </div>

        <p className="sr-only" aria-live="polite">
          {touched &&
            (supply === "intra"
              ? `Intra-state supply: CGST ${GST_RATE / 2}% and SGST ${GST_RATE / 2}%, ₹${formatAmount(cgst)} each.`
              : `Inter-state supply: IGST ${GST_RATE}%, ₹${formatAmount(tax)}.`)}
        </p>
      </figure>

      {/* Issuing deducts stock — the cause and effect the product is built around */}
      <AnimatePresence>
        {issued && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="relative mx-auto -mt-4 flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-float sm:absolute sm:-bottom-11 sm:-left-5 sm:mt-0"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-positive-tint text-positive">
              <PackageMinus aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 text-xs leading-snug">
              <span className="block font-medium text-foreground">Stock updated · Pune warehouse</span>
              <span className="block text-muted-foreground">
                LED panel 18 W <span className="font-mono tabular-nums">120 → 96</span>
              </span>
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaxRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">
        {formatAmount(value)}
      </span>
    </div>
  );
}
