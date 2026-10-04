import { CheckCircle2 } from "lucide-react";
import { formatAmount } from "../../format";
import { Container, Section, SectionHeading } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

// Each point is how the backend actually behaves (CLAUDE.md §4.5, §4.6, §4.6.1)
const details = [
  {
    title: "The right tax for the place of supply",
    body: "Your registered state is compared with the customer's billing state on every invoice: CGST and SGST within the state, IGST across it.",
  },
  {
    title: "Split to the paisa",
    body: "Amounts round half-up to two decimals, and SGST is whatever remains after CGST — so the two halves always add back to the exact tax.",
  },
  {
    title: "Only issued invoices count",
    body: "Drafts and voided invoices never reach GSTR-1, GSTR-3B, the HSN summary, the sales register or profit and loss.",
  },
  {
    title: "Numbers that never collide",
    body: "Each document series is locked while a number is taken, so two people saving at once can't both get INV-0046.",
  },
  {
    title: "Rates that can't be quietly re-priced",
    body: "Once a tax rate is used on a document it can be renamed or retired, not changed — old invoices stay exactly as issued.",
  },
];

const summary = [
  { label: "Integrated tax (IGST)", value: 112320 },
  { label: "Central tax (CGST)", value: 109890 },
  { label: "State/UT tax (SGST)", value: 109890 },
];
const totalTax = summary.reduce((sum, row) => sum + row.value, 0);

export function GstDetails() {
  return (
    <Section tone="inverse" aria-labelledby="gst-title">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <SectionHeading
            id="gst-title"
            eyebrow="Built for GST"
            title="Details your CA will notice."
            lead="Compliance isn't a report bolted on at the end. It's in how every invoice is calculated, numbered and stored."
          />
          <ol className="mt-12 border-t border-border">
            {details.map((detail, index) => (
              <li key={detail.title} className="border-b border-border">
                <Reveal delay={index * 0.05} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6 sm:grid-cols-[3.5rem_1fr]">
                  <span className="pt-0.5 font-mono text-sm text-subtle">0{index + 1}</span>
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold text-foreground">{detail.title}</h3>
                    <p className="mt-1.5 max-w-[56ch] leading-relaxed text-muted-foreground">{detail.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 lg:pt-28">
          <Reveal className="lg:sticky lg:top-28">
            <figure
              aria-label="Example GSTR-3B summary for September 2026"
              className="rounded-[14px] border border-border bg-card p-6 sm:p-7"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">GSTR-3B</p>
                <p className="text-xs text-muted-foreground">September 2026</p>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">3.1(a) Outward taxable supplies</p>
              <p className="mt-1 font-mono text-[1.75rem] font-medium tracking-tight tabular-nums text-foreground">
                ₹{formatAmount(1842600)}
              </p>
              <table className="mt-6 w-full text-sm">
                <caption className="sr-only">Tax by type</caption>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <th scope="row" className="py-2.5 text-left font-normal text-muted-foreground">
                        {row.label}
                      </th>
                      <td className="py-2.5 text-right font-mono tabular-nums text-foreground">{formatAmount(row.value)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-rule-strong">
                    <th scope="row" className="pt-3 text-left font-medium text-foreground">
                      Total tax
                    </th>
                    <td className="pt-3 text-right font-mono font-semibold tabular-nums text-foreground">
                      {formatAmount(totalTax)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <figcaption className="mt-6 flex items-start gap-2.5 rounded-lg bg-positive-tint px-3.5 py-3 text-xs leading-relaxed text-foreground">
                <CheckCircle2 aria-hidden className="mt-px size-4 shrink-0 text-positive" />
                <span>
                  Built from 214 issued invoices. <span className="text-muted-foreground">3 drafts left out.</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
