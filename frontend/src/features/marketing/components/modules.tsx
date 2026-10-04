import type { ComponentType } from "react";
import { BillingPanel, CollectionsPanel, InventoryPanel, ReportsPanel, TeamPanel } from "./product-panels";

export interface ProductModule {
  /** Also the anchor on /features */
  id: "billing" | "inventory" | "collections" | "reports" | "team";
  tab: string;
  title: string;
  summary: string;
  /** Short list for the home-page tour */
  points: string[];
  /** Fuller list for /features */
  details: string[];
  Panel: ComponentType<{ className?: string }>;
}

// Every point below maps to shipped behaviour (see CLAUDE.md §1, §4.5–4.6.1). Keep it that way:
// don't list a capability here until it exists in the product.
export const productModules: ProductModule[] = [
  {
    id: "billing",
    tab: "Billing & GST",
    title: "GST invoices without the arithmetic.",
    summary:
      "Raise quotations, sales orders and invoices with tax worked out on every line. Drafts stay out of your returns until you issue them.",
    points: [
      "CGST, SGST or IGST from the place of supply",
      "Sequential numbers that are never duplicated",
      "Invoice and quotation PDFs, ready to send",
    ],
    details: [
      "Quotations, sales orders and invoices, each with its own number series",
      "CGST + SGST within your state, IGST across states — decided per invoice",
      "Line totals, tax and invoice totals calculated on the server",
      "Save as draft, issue when ready — issuing deducts stock and raises the receivable",
      "PDFs for invoices, quotations and purchase orders",
      "Tax rates in use can be renamed or retired, never silently re-priced",
    ],
    Panel: BillingPanel,
  },
  {
    id: "inventory",
    tab: "Stock & purchases",
    title: "Stock that moves when the paperwork does.",
    summary:
      "Sales take stock out, purchase bills bring it in, and adjustments explain the rest — across every warehouse you run.",
    points: [
      "Quantities per warehouse, updated by invoices and bills",
      "Weighted average cost from what you actually paid",
      "Purchase orders billed once, against the right supplier",
    ],
    details: [
      "Products and categories, with bulk import from a spreadsheet",
      "Stock per warehouse: invoices take it out, purchase bills bring it in",
      "Adjustments and transfers kept as a movement history",
      "Weighted average cost, kept separate from your selling price",
      "Purchase orders to suppliers, billed once against the right supplier",
      "Supplier payables that update as you pay",
    ],
    Panel: InventoryPanel,
  },
  {
    id: "collections",
    tab: "Field collections",
    title: "Cash from the field, accounted for.",
    summary:
      "Give each collector a QR code. Payments, expenses and bank deposits are recorded as they happen, then verified before they count.",
    points: [
      "UPI and cash collections against customer balances",
      "Expenses and settlement deposits in one ledger",
      "Verified by the collector's owner or an admin",
    ],
    details: [
      "A QR code for each collector or counter",
      "Cash and UPI collections recorded against the customer",
      "Field expenses logged as they happen",
      "Settlement deposits that show what's still in hand",
      "Nothing counts until it's verified by the collector's owner or an admin",
      "A running ledger for every collector",
    ],
    Panel: CollectionsPanel,
  },
  {
    id: "reports",
    tab: "Reports",
    title: "Numbers your CA can file from.",
    summary:
      "GST returns, profit and loss, receivables, payables and stock reports — built from issued documents, never re-keyed figures.",
    points: [
      "GSTR-1, GSTR-3B and HSN summary for any period",
      "Profit & loss on taxable value",
      "Chart of accounts and journal entries",
    ],
    details: [
      "GSTR-1, GSTR-3B and HSN summary for any date range",
      "GSTR-3B sets input tax credit off head by head, showing the cash to pay and the credit carried forward",
      "Sales and purchase registers",
      "Profit & loss on taxable value",
      "Receivables and payables by customer and supplier",
      "Stock by warehouse",
      "Chart of accounts and journal entries for your accountant",
    ],
    Panel: ReportsPanel,
  },
  {
    id: "team",
    tab: "Team & roles",
    title: "Everyone sees what their role allows.",
    summary:
      "Add people with a role in your organisation. Branches inherit roles from the parent, and every change lands in an audit log.",
    points: [
      "Owner, Admin, Manager, User and Viewer roles",
      "Branches that can share customers and products",
      "An audit log of who changed what, and when",
    ],
    details: [
      "Owner, Admin, Manager, User and Viewer — checked on every action",
      "Add teammates with a temporary password they change on first sign-in",
      "Branches that inherit roles and can share customers and products",
      "An audit log of who issued, edited or deleted what",
      "Reset passwords or deactivate a member in one click",
      "Sign in with email and password or Google",
    ],
    Panel: TeamPanel,
  },
];
