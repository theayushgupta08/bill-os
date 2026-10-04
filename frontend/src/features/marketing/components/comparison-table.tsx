import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { comparison, plans } from "../content/plans";

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-foreground">{value}</span>;
  return value ? (
    <>
      <Check aria-hidden className="mx-auto size-4 text-positive" />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus aria-hidden className="mx-auto size-4 text-rule-strong" />
      <span className="sr-only">Not included</span>
    </>
  );
}

/** Full plan comparison. Scrolls sideways on phones with the feature column pinned. */
export function ComparisonTable() {
  return (
    // `relative` makes this the containing block for the sr-only labels (position: absolute), so they're
    // clipped by the scroller instead of widening the whole page on phones
    <div className="relative overflow-x-auto rounded-[14px] border border-border bg-card">
      <table className="w-full min-w-[34rem] sm:min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">What each plan includes</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 w-40 bg-card py-4 pl-5 sm:w-[40%] font-medium text-muted-foreground sm:pl-6">
              Feature
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                scope="col"
                className={cn("px-4 py-4 text-center font-semibold text-foreground", plan.recommended && "bg-brand-tint/50")}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((group) => (
            <Fragment key={group.category}>
              <tr className="border-t border-border bg-sunken">
                <th
                  scope="colgroup"
                  colSpan={plans.length + 1}
                  className="sticky left-0 py-2.5 pl-5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-subtle sm:pl-6"
                >
                  {group.category}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.name} className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-card py-3.5 pr-4 pl-5 font-normal text-foreground sm:pl-6">
                    {row.name}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={plan.id}
                      className={cn("px-4 py-3.5 text-center", plan.recommended && "bg-brand-tint/50")}
                    >
                      <Cell value={row.values[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
