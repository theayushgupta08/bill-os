import { siteConfig } from "@/lib/config";

export interface Faq {
  question: string;
  answer: string;
}

const trialDays = siteConfig.policies.freeTrialDays;

export const homeFaqs: Faq[] = [
  {
    question: `Who is ${siteConfig.name} for?`,
    answer:
      "Indian small and mid-sized businesses — traders, distributors, retailers and service firms — that want GST invoices, stock, payments and reports in one set of books instead of three tools and a spreadsheet.",
  },
  {
    question: "Does it work out CGST, SGST and IGST on its own?",
    answer:
      "Yes. Every invoice compares your registered state with the customer's billing state. Within the state, tax is split equally into CGST and SGST; across states it becomes IGST. Line totals and tax are calculated on our servers, never typed in by hand.",
  },
  {
    question: "Can my CA get GSTR-1 and GSTR-3B from it?",
    answer:
      "Yes. The GST reports produce GSTR-1, GSTR-3B and an HSN summary for any period, built only from issued invoices — drafts and voided documents are left out. You still file on the GST portal; the numbers are ready for it.",
  },
  {
    question: "Can I bring in my existing customers and products?",
    answer:
      "Yes. Customers, products and categories can be imported in bulk from a spreadsheet, so you don't start from an empty screen.",
  },
  {
    question: "Can staff use it without being able to change everything?",
    answer:
      "Yes. Each person gets a role in your organisation — Owner, Admin, Manager, User or Viewer. Viewers can read but not change anything, deleting needs a Manager, and settings need an Admin. Every change is recorded in the audit log.",
  },
  {
    question: "Is there an AI assistant?",
    answer:
      "Not yet. We're building one that answers questions about your own books in plain language. It isn't available today, and we'd rather say so than show you something you can't use.",
  },
  {
    question: "What happens when the free trial ends?",
    answer: `The trial lasts ${trialDays} days and doesn't need a card. When it ends, choose a plan to keep going — your data stays exactly where you left it.`,
  },
];

export const pricingFaqs: Faq[] = [
  {
    question: "Do you offer a free trial?",
    answer: `Yes — every plan starts with a ${trialDays}-day free trial. No credit card required.`,
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or downgrade at any time. If you upgrade in the middle of a billing cycle, you're charged a prorated amount.",
  },
  {
    question: "Are prices inclusive of GST?",
    answer:
      "No. Prices are per month and exclude GST, which is added to your subscription invoice as applicable. There are no setup fees.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data belongs to you. Before your account closes you can download your invoices and reports, and we'll help with anything else you need to take with you.",
  },
];
