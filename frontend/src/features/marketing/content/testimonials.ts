import type { Testimonial } from "@/components/ui/testimonials-columns-1";

/**
 * Real customer testimonials — the only ones the public site shows. Add a quote only with the customer's
 * permission, in their own words; a photo goes in /public/testimonials/ and only if they agreed to it.
 * While this list is empty, the Testimonials section isn't rendered in production.
 */
export const testimonials: Testimonial[] = [];

/**
 * SAMPLE quotes for designing the section. They are invented, so they are shown in development only (with a
 * "Sample quotes" label) and never in a production build — publishing them as reviews would mislead customers
 * (design-system/billos/MASTER.md: no invented social proof). Replace them by filling `testimonials` above.
 */
export const sampleTestimonials: Testimonial[] = [
  {
    quote:
      "Every invoice now splits CGST and SGST, or charges IGST, on its own. Our CA gets GSTR-1 and 3B straight from billOS instead of my spreadsheets.",
    name: "Rakesh M.",
    role: "Owner, hardware wholesaler",
  },
  {
    quote:
      "We keep stock in two godowns. Issuing an invoice takes the items out of the right one, so the numbers finally match what's on the shelf.",
    name: "Priya S.",
    role: "Operations head, packaging supplier",
  },
  {
    quote:
      "Our field staff record cash and UPI collections against their QR codes, and I verify each one before it reaches the ledger.",
    name: "Anil K.",
    role: "Founder, FMCG distributor",
  },
  {
    quote:
      "Quotations, orders and invoices number themselves in sequence, and the PDFs go to customers the same day.",
    name: "Meera J.",
    role: "Sales manager, industrial spares",
  },
  {
    quote:
      "Purchase bills update stock and what we owe each supplier in one step, and the payables report shows who to pay this week.",
    name: "Farhan A.",
    role: "Accounts, electrical contractor",
  },
  {
    quote:
      "Our branch bills customers the head office shares with it, and each office still sees only its own receivables.",
    name: "Kavita R.",
    role: "Director, pharma distributor",
  },
  {
    quote:
      "The HSN summary used to take a day at quarter end. Now it's a report I download.",
    name: "Suresh P.",
    role: "Partner, textile trader",
  },
  {
    quote:
      "Viewers can look but not change anything, and the audit log shows who issued or edited what.",
    name: "Neha V.",
    role: "Finance lead, auto components maker",
  },
  {
    quote:
      "Receipts settle invoices partly or in full, and the customer statement shows the running balance for each branch.",
    name: "Imran S.",
    role: "Owner, building materials store",
  },
];
