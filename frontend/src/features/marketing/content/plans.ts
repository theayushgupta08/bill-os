// Single source for plan data — the home page preview and /pricing both read from here, so the two
// can never quote different prices again. Prices are per month, exclusive of GST.

export type BillingCycle = "monthly" | "annual";

export interface Plan {
  id: "starter" | "pro" | "enterprise";
  name: string;
  summary: string;
  /** null = custom pricing */
  price: Record<BillingCycle, number> | null;
  features: string[];
  cta: { label: string; href: string };
  recommended?: boolean;
}

export const ANNUAL_SAVING_LABEL = "Save 20%";

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "For freelancers and single-counter shops getting GST billing in order.",
    price: { monthly: 999, annual: 799 },
    features: [
      "Up to 50 invoices a month",
      "GSTR-1, GSTR-3B and HSN summary",
      "Customers, products and stock",
      "1 user",
      "Email support",
    ],
    cta: { label: "Start free trial", href: "/register" },
  },
  {
    id: "pro",
    name: "Pro",
    summary: "For growing teams that sell, buy and collect every day.",
    price: { monthly: 2499, annual: 1999 },
    features: [
      "Unlimited invoices",
      "Up to 5 users with roles",
      "Quotations, orders and purchase bills",
      "Field collections with QR codes",
      "Profit & loss, receivables and payables",
      "Priority support",
    ],
    cta: { label: "Start free trial", href: "/register" },
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    summary: "For distributors with several warehouses, branches and a finance team.",
    price: null,
    features: [
      "Everything in Pro",
      "Unlimited users",
      "Multiple warehouses and branches",
      "Help migrating your existing data",
      "A dedicated account manager",
    ],
    cta: { label: "Talk to us", href: "/contact" },
  },
];

type Cell = boolean | string;

export interface ComparisonGroup {
  category: string;
  rows: { name: string; values: Record<Plan["id"], Cell> }[];
}

export const comparison: ComparisonGroup[] = [
  {
    category: "Billing & GST",
    rows: [
      { name: "Invoices per month", values: { starter: "50", pro: "Unlimited", enterprise: "Unlimited" } },
      { name: "CGST / SGST / IGST worked out per invoice", values: { starter: true, pro: true, enterprise: true } },
      { name: "GSTR-1, GSTR-3B and HSN summary", values: { starter: true, pro: true, enterprise: true } },
      { name: "Quotations and sales orders", values: { starter: false, pro: true, enterprise: true } },
      { name: "Invoice and quotation PDFs", values: { starter: true, pro: true, enterprise: true } },
    ],
  },
  {
    category: "Stock & purchases",
    rows: [
      { name: "Products, categories and stock levels", values: { starter: true, pro: true, enterprise: true } },
      { name: "Purchase orders and bills", values: { starter: false, pro: true, enterprise: true } },
      { name: "Weighted average cost", values: { starter: true, pro: true, enterprise: true } },
      { name: "Multiple warehouses", values: { starter: false, pro: false, enterprise: true } },
    ],
  },
  {
    category: "Money & reports",
    rows: [
      { name: "Payments with allocation to invoices", values: { starter: true, pro: true, enterprise: true } },
      { name: "Field collections (QR, cash, deposits)", values: { starter: false, pro: true, enterprise: true } },
      { name: "Profit & loss, receivables, payables", values: { starter: false, pro: true, enterprise: true } },
      { name: "Chart of accounts and journal entries", values: { starter: false, pro: true, enterprise: true } },
    ],
  },
  {
    category: "Team & support",
    rows: [
      { name: "Users", values: { starter: "1", pro: "5", enterprise: "Unlimited" } },
      { name: "Roles and audit log", values: { starter: false, pro: true, enterprise: true } },
      { name: "Branches", values: { starter: false, pro: false, enterprise: true } },
      { name: "Support", values: { starter: "Email", pro: "Priority", enterprise: "Account manager" } },
    ],
  },
];
