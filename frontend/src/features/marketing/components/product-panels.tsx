import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatAmount, formatRupees } from "../format";
import { StatusPill, type Status } from "./primitives/status-pill";

/*
 * Illustrations of billOS screens, drawn in HTML so they stay sharp, light and accessible. The app is
 * dark, so they use the ink tone. Each one is role="img" with a summary label: a screen reader hears
 * what the screen shows instead of every cell of a pretend table. Sample data only.
 */

interface AppWindowProps {
  crumbs: string[];
  label: string;
  children: ReactNode;
  className?: string;
}

export function AppWindow({ crumbs, label, children, className }: AppWindowProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "tone-inverse overflow-hidden rounded-[14px] border border-border bg-background text-foreground shadow-float",
        className
      )}
    >
      <div className="flex h-11 items-center gap-2 border-b border-border px-4 text-xs">
        {crumbs.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-2">
            {index > 0 && <span className="text-subtle">/</span>}
            <span className={index === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground"}>{crumb}</span>
          </span>
        ))}
      </div>
      <div className="p-3.5 sm:p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "negative" | "positive" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-2.5 py-2.5 sm:px-3">
      <p className="truncate text-[0.6875rem] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-xs font-medium tabular-nums sm:text-sm",
          tone === "negative" ? "text-negative" : tone === "positive" ? "text-positive" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

const cell = "py-2 pr-3 last:pr-0";

/* ── Billing & GST ─────────────────────────────────────────────────────────── */

const invoices: { no: string; customer: string; date: string; amount: number; status: Status; label: string }[] = [
  { no: "INV-0047", customer: "Kulkarni Agencies", date: "04 Oct", amount: 9440, status: "draft", label: "Draft" },
  { no: "INV-0046", customer: "Sharma Traders", date: "04 Oct", amount: 25488, status: "issued", label: "Issued" },
  { no: "INV-0045", customer: "Patil Hardware", date: "03 Oct", amount: 8260, status: "paid", label: "Paid" },
  { no: "INV-0044", customer: "Deccan Builders", date: "02 Oct", amount: 112100, status: "partial", label: "Partial" },
  { no: "INV-0043", customer: "Nair & Sons", date: "12 Sep", amount: 14750, status: "overdue", label: "Overdue" },
];

export function BillingPanel({ className }: { className?: string }) {
  return (
    <AppWindow
      crumbs={["Sales", "Invoices"]}
      label="The invoices screen: five recent GST invoices with draft, issued, paid, partially paid and overdue statuses, above totals for the month."
      className={className}
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Issued in Oct" value={formatRupees(1842600)} />
        <Stat label="Outstanding" value={formatRupees(312450)} />
        <Stat label="Overdue" value="4 invoices" tone="negative" />
      </div>
      <table className="mt-4 w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th className={cn(cell, "font-normal")}>Number</th>
            <th className={cn(cell, "font-normal")}>Customer</th>
            <th className={cn(cell, "hidden font-normal sm:table-cell")}>Date</th>
            <th className={cn(cell, "text-right font-normal")}>Amount</th>
            <th className={cn(cell, "hidden text-right font-normal sm:table-cell")}>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.no} className="border-b border-border last:border-0">
              <td className={cn(cell, "font-mono text-muted-foreground")}>{invoice.no}</td>
              <td className={cn(cell, "max-w-[9rem] truncate text-foreground")}>{invoice.customer}</td>
              <td className={cn(cell, "hidden text-muted-foreground sm:table-cell")}>{invoice.date}</td>
              <td className={cn(cell, "text-right font-mono tabular-nums text-foreground")}>{formatAmount(invoice.amount)}</td>
              <td className={cn(cell, "hidden text-right sm:table-cell")}>
                <StatusPill status={invoice.status}>{invoice.label}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppWindow>
  );
}

/* ── Stock & purchases ─────────────────────────────────────────────────────── */

const stock = [
  { product: "LED panel 18 W", pune: 96, nashik: 40, cost: 312.4 },
  { product: "Copper wire 1.5 mm²", pune: 18, nashik: 22, cost: 1018 },
  { product: "MCB 32 A", pune: 140, nashik: 64, cost: 201.75 },
  { product: "Switch board 6M", pune: 7, nashik: 30, cost: 148 },
];

const movements = [
  { ref: "PB-0031", what: "Purchase bill", qty: "+100", tone: "positive" },
  { ref: "INV-0046", what: "Sale", qty: "−24", tone: "neutral" },
  { ref: "ADJ", what: "Damaged in transit", qty: "−2", tone: "negative" },
] as const;

export function InventoryPanel({ className }: { className?: string }) {
  return (
    <AppWindow
      crumbs={["Inventory", "Stock levels"]}
      label="The stock screen: quantities for four products across the Pune and Nashik warehouses with weighted average cost, and recent stock movements from a purchase bill, a sale and an adjustment."
      className={className}
    >
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th className={cn(cell, "font-normal")}>Product</th>
            <th className={cn(cell, "text-right font-normal")}>Pune</th>
            <th className={cn(cell, "text-right font-normal")}>Nashik</th>
            <th className={cn(cell, "hidden text-right font-normal sm:table-cell")}>Avg cost</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((row) => (
            <tr key={row.product} className="border-b border-border last:border-0">
              <td className={cn(cell, "text-foreground")}>{row.product}</td>
              <td className={cn(cell, "text-right font-mono tabular-nums text-foreground")}>{row.pune}</td>
              <td className={cn(cell, "text-right font-mono tabular-nums text-foreground")}>{row.nashik}</td>
              <td className={cn(cell, "hidden text-right font-mono tabular-nums text-muted-foreground sm:table-cell")}>
                {formatAmount(row.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-5 text-[0.6875rem] text-muted-foreground">Movements · LED panel 18 W</p>
      <ul className="mt-2 space-y-1.5">
        {movements.map((move) => (
          <li key={move.ref} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-muted-foreground">{move.ref}</span>
              <span className="truncate text-foreground">{move.what}</span>
            </span>
            <span
              className={cn(
                "font-mono tabular-nums",
                move.tone === "positive" ? "text-positive" : move.tone === "negative" ? "text-negative" : "text-foreground"
              )}
            >
              {move.qty}
            </span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}

/* ── Field collections ─────────────────────────────────────────────────────── */

const collections: { party: string; mode: string; amount: string; status: Status; label: string }[] = [
  { party: "Sharma Traders", mode: "UPI", amount: "15,000.00", status: "paid", label: "Verified" },
  { party: "Patil Hardware", mode: "Cash", amount: "8,200.00", status: "paid", label: "Verified" },
  { party: "Om Sai Stores", mode: "Cash", amount: "25,000.00", status: "issued", label: "To verify" },
];

export function CollectionsPanel({ className }: { className?: string }) {
  return (
    <AppWindow
      crumbs={["Collections", "Ravi K. · QR-07"]}
      label="The field collections screen for one collector: three payments collected today by UPI and cash, two verified and one awaiting verification, an expense, and the amount left to deposit."
      className={className}
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Collected today" value="₹48,200" />
        <Stat label="Expenses" value="₹1,150" />
        <Stat label="To deposit" value="₹47,050" tone="positive" />
      </div>
      <ul className="mt-4 divide-y divide-border text-xs">
        {collections.map((row) => (
          <li key={row.party} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-foreground">{row.party}</span>
              <span className="text-muted-foreground">{row.mode}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="font-mono tabular-nums text-foreground">{row.amount}</span>
              <StatusPill status={row.status} className="hidden sm:inline-flex">
                {row.label}
              </StatusPill>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-foreground">Fuel</span>
            <span className="text-muted-foreground">Expense</span>
          </span>
          <span className="font-mono tabular-nums text-negative">−1,150.00</span>
        </li>
      </ul>
    </AppWindow>
  );
}

/* ── Reports ───────────────────────────────────────────────────────────────── */

// One series (taxable sales), so the title names it and there's no legend; only the latest bar is
// labelled directly. Lakh values.
const sales = [
  { month: "Apr", value: 14.2 },
  { month: "May", value: 15.8 },
  { month: "Jun", value: 13.9 },
  { month: "Jul", value: 16.4 },
  { month: "Aug", value: 17.1 },
  { month: "Sep", value: 18.4 },
];
const peak = Math.max(...sales.map((s) => s.value));

const owed = [
  { customer: "Deccan Builders", amount: "84,075.00" },
  { customer: "Sharma Traders", amount: "25,488.00" },
  { customer: "Nair & Sons", amount: "14,750.00" },
];

export function ReportsPanel({ className }: { className?: string }) {
  const latest = sales[sales.length - 1];
  return (
    <AppWindow
      crumbs={["Reports", "Profit & loss"]}
      label={`The reports screen: taxable sales for April to September, rising from ₹14.2 lakh to ₹${latest.value} lakh, with gross profit for the half year and the three customers who owe the most.`}
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[0.6875rem] text-muted-foreground">Taxable sales · ₹ lakh</p>
            <p className="text-[0.6875rem] text-muted-foreground">Apr–Sep</p>
          </div>
          <div className="mt-4 flex h-28 items-end gap-1.5 border-b border-border">
            {sales.map((s, index) => {
              const isLatest = index === sales.length - 1;
              return (
                <div key={s.month} className="relative flex h-full flex-1 flex-col justify-end">
                  {isLatest && (
                    <span className="absolute inset-x-0 -top-0.5 text-center font-mono text-[0.625rem] text-foreground">
                      {s.value}
                    </span>
                  )}
                  <span
                    className={cn("block rounded-t-[4px]", isLatest ? "bg-link" : "bg-link/45")}
                    style={{ height: `${(s.value / peak) * 82}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {sales.map((s) => (
              <span key={s.month} className="flex-1 text-center text-[0.625rem] text-muted-foreground">
                {s.month}
              </span>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-2">
          <Stat label="Gross profit, H1" value={formatRupees(1268400)} tone="positive" />
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-[0.6875rem] text-muted-foreground">Who owes you</p>
            <ul className="mt-1.5 space-y-1 text-xs">
              {owed.map((row) => (
                <li key={row.customer} className="flex justify-between gap-2">
                  <span className="truncate text-foreground">{row.customer}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{row.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

/* ── Team & roles ──────────────────────────────────────────────────────────── */

const members = [
  { name: "Anita Deshmukh", role: "Owner" },
  { name: "Rohan Mehta", role: "Admin" },
  { name: "Priya Iyer", role: "Manager" },
  { name: "Ravi Kumar", role: "User" },
  { name: "S. Rao, CA", role: "Viewer" },
];

const audit = [
  { who: "Priya", what: "issued INV-0046", when: "10:42" },
  { who: "Ravi", what: "recorded ₹15,000 UPI", when: "11:05" },
  { who: "Rohan", what: "renamed tax rate “GST 18%”", when: "11:30" },
];

export function TeamPanel({ className }: { className?: string }) {
  return (
    <AppWindow
      crumbs={["Settings", "Team"]}
      label="The team screen: five people with Owner, Admin, Manager, User and Viewer roles, and an audit log showing who issued an invoice, recorded a payment and renamed a tax rate."
      className={className}
    >
      <ul className="divide-y divide-border text-xs">
        {members.map((member) => (
          <li key={member.name} className="flex items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-medium text-muted-foreground">
                {member.name[0]}
              </span>
              <span className="truncate text-foreground">{member.name}</span>
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">{member.role}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.6875rem] text-muted-foreground">Audit log · today</p>
      <ul className="mt-2 space-y-1.5 text-xs">
        {audit.map((entry) => (
          <li key={entry.what} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <span className="min-w-0 truncate">
              <span className="text-foreground">{entry.who}</span>{" "}
              <span className="text-muted-foreground">{entry.what}</span>
            </span>
            <span className="shrink-0 font-mono text-muted-foreground">{entry.when}</span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}
