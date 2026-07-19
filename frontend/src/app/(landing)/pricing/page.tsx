import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { PricingClient } from "./PricingClient";
import { 
  CheckCircle2, 
  Minus,
  HelpCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: `Pricing | ${siteConfig.name}`,
  description: "Transparent pricing for businesses of all sizes. Start your free trial today.",
};

const comparisonFeatures = [
  {
    category: "Invoicing & GST",
    items: [
      { name: "e-Invoices per month", starter: "50", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "GST Reports (GSTR-1, 2, 3B)", starter: true, pro: true, enterprise: true },
      { name: "e-Way Bill Generation", starter: false, pro: true, enterprise: true },
      { name: "Direct Portal Filing", starter: false, pro: true, enterprise: true },
    ]
  },
  {
    category: "Inventory",
    items: [
      { name: "Stock Tracking", starter: "Basic", pro: "Advanced", enterprise: "Advanced" },
      { name: "Multi-warehouse Support", starter: false, pro: false, enterprise: true },
      { name: "Barcode Scanning", starter: false, pro: true, enterprise: true },
    ]
  },
  {
    category: "Platform & Support",
    items: [
      { name: "User Accounts", starter: "1", pro: "5", enterprise: "Unlimited" },
      { name: "AI Assistant", starter: false, pro: true, enterprise: true },
      { name: "API Access", starter: false, pro: false, enterprise: true },
      { name: "Support Level", starter: "Email", pro: "24/7 Priority", enterprise: "Dedicated Rep" },
    ]
  }
];

const faqs = [
  {
    question: "Do you offer a free trial?",
    answer: `Yes! You can try ${siteConfig.name} completely free for ${siteConfig.policies.freeTrialDays} days. No credit card required.`,
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time. If you upgrade mid-billing cycle, you'll be charged a prorated amount.",
  },
  {
    question: "Are there any setup or hidden fees?",
    answer: "No, there are no hidden fees or setup charges. You only pay the flat subscription fee shown on this page. Taxes (like GST) will be added to your invoice as applicable.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data belongs to you. If you cancel your subscription, you'll be able to export all your invoices, inventory logs, and customer data in CSV/PDF formats before your account is closed.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen pt-32 pb-24">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 relative z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          No hidden fees. No surprise charges. Choose the plan that best fits your business needs.
        </p>
      </section>

      {/* Interactive Pricing Toggle & Cards */}
      <section className="px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <PricingClient />
      </section>

      {/* Feature Comparison Table */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Compare plans in detail</h2>
          <p className="text-muted-foreground">See exactly what's included in every tier.</p>
        </div>

        <div className="bg-background rounded-3xl border border-border/50 shadow-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="py-6 px-8 font-semibold text-foreground w-1/3 border-b border-border/50">Features</th>
                <th className="py-6 px-6 font-semibold text-foreground text-center border-b border-border/50">Starter</th>
                <th className="py-6 px-6 font-semibold text-primary text-center border-b border-border/50">Pro</th>
                <th className="py-6 px-6 font-semibold text-foreground text-center border-b border-border/50">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((category, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td colSpan={4} className="bg-muted/10 py-4 px-8 text-sm font-bold text-foreground tracking-wider uppercase border-b border-border/50">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, j) => (
                    <tr key={j} className="group hover:bg-muted/5 transition-colors">
                      <td className="py-4 px-8 text-sm text-muted-foreground font-medium border-b border-border/50">
                        {item.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-center border-b border-border/50">
                        {typeof item.starter === "boolean" ? (
                          item.starter ? <CheckCircle2 className="w-5 h-5 text-primary mx-auto" /> : <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        ) : (
                          <span className="text-foreground">{item.starter}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-center border-b border-border/50">
                        {typeof item.pro === "boolean" ? (
                          item.pro ? <CheckCircle2 className="w-5 h-5 text-primary mx-auto" /> : <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        ) : (
                          <span className="text-foreground">{item.pro}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-center border-b border-border/50">
                        {typeof item.enterprise === "boolean" ? (
                          item.enterprise ? <CheckCircle2 className="w-5 h-5 text-primary mx-auto" /> : <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        ) : (
                          <span className="text-foreground">{item.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
        </div>

        <Accordion className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
