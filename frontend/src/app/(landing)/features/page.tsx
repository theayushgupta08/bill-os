import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import {
  FileText,
  Package,
  BrainCircuit,
  Workflow,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Features | ${siteConfig.name}`,
  description: "Explore the powerful features of BillOS including GST Billing, Inventory, AI Assistant, and Integrations.",
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            The All-in-One Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Everything you need to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              run your business
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            From automated GST compliance to AI-driven insights, {siteConfig.name} provides the most complete toolkit for modern enterprises.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full h-12 px-8 w-full sm:w-auto text-base">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 w-full sm:w-auto text-base">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Feature 1: GST Billing */}
      <section id="billing" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl" />
              <div className="relative bg-background border border-border/50 rounded-3xl p-8 shadow-2xl h-[400px] flex flex-col justify-center items-center text-center">
                {/* Placeholder for actual UI screenshot */}
                <FileText className="w-24 h-24 text-primary/40 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-2">Beautiful Invoices</h3>
                <p className="text-muted-foreground max-w-sm">Generate professional, tax-compliant invoices in under 10 seconds.</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">GST Billing & e-Invoicing</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Stay 100% compliant with our automated tax engine. Generate e-invoices, calculate CGST/SGST instantly, and file returns with a single click.
              </p>
              <ul className="space-y-4 mb-8">
                {["Automated tax rate calculation", "Customizable invoice templates", "Recurring billing & subscriptions", "One-click e-way bill generation"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Inventory */}
      <section id="inventory" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Smart Inventory Management</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Never run out of stock again. Track your inventory across multiple warehouses in real-time and get predictive restock alerts.
              </p>
              <ul className="space-y-4 mb-8">
                {["Multi-warehouse tracking", "Low stock threshold alerts", "Barcode scanning support", "Batch tracking & expiry management"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-3xl blur-3xl" />
              <div className="relative bg-background border border-border/50 rounded-3xl p-8 shadow-2xl h-[400px] flex flex-col justify-center items-center text-center">
                <Package className="w-24 h-24 text-blue-500/40 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-2">Real-time Tracking</h3>
                <p className="text-muted-foreground max-w-sm">Watch your stock levels update instantly as sales are made.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: AI Assistant */}
      <section id="ai" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 scroll-mt-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent rounded-3xl blur-3xl" />
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-[400px] flex flex-col justify-center items-center text-center">
                <BrainCircuit className="w-24 h-24 text-primary mb-6 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">Ask your data anything</h3>
                <p className="text-white/70 max-w-sm">&quot;What were our top selling products last month across all branches?&quot;</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">BillOS AI Assistant</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Your personal financial analyst. Our secure, private AI automatically categorizes expenses, matches bank transactions, and predicts cash flow.
              </p>
              <ul className="space-y-4 mb-8">
                {["Automated expense categorization", "Predictive cash flow forecasting", "Natural language financial queries", "Smart receipt scanning & OCR"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Integrations */}
      <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6 mx-auto">
            <Workflow className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Seamless Integrations</h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
            Connect {siteConfig.name} with the tools you already use. Our API and native integrations keep your data synchronized everywhere.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["Razorpay", "Stripe", "WhatsApp", "Tally", "Slack", "Shopify", "Zoho", "AWS"].map((integration, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-background border border-border shadow-sm flex items-center justify-center mb-4 text-foreground/50 font-bold">
                  {/* Placeholder for logo */}
                  {integration[0]}
                </div>
                <h4 className="font-semibold">{integration}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your business?</h2>
          <p className="text-xl opacity-90 mb-10">Join thousands of companies using {siteConfig.name} to grow faster.</p>
          <Button size="lg" variant="secondary" className="rounded-full h-14 px-10 text-lg font-semibold">
            Start your free trial <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
