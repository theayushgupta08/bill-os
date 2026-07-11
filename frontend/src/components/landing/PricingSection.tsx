"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start for free, upgrade when you need more power.
          </p>

          <div className="inline-flex items-center p-1 bg-muted rounded-full border border-border">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="rounded-3xl border border-border bg-card p-8 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <p className="text-muted-foreground text-sm mb-6">Perfect for small retail shops and freelancers.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹{isYearly ? "999" : "1,299"}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Button asChild variant="outline" className="w-full mb-8 rounded-full h-12">
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <ul className="space-y-3 mt-auto">
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Up to 500 invoices/mo</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> 1 User</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Basic Inventory</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> WhatsApp Integration</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-2xl shadow-primary/10 transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              RECOMMENDED
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6">For growing businesses needing AI insights.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹{isYearly ? "2,499" : "2,999"}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Button asChild className="w-full mb-8 rounded-full h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40">
              <Link href="/register">Get Started</Link>
            </Button>
            <ul className="space-y-3 mt-auto">
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited invoices</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> 5 Users</li>
              <li className="flex items-center gap-2 text-sm font-medium text-foreground"><CheckCircle2 className="w-4 h-4 text-primary" /> AI Business Assistant</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Advanced Reports</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> E-way Bill Generation</li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-3xl border border-border bg-card p-8 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <p className="text-muted-foreground text-sm mb-6">For large distributors and manufacturers.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <Button variant="outline" className="w-full mb-8 rounded-full h-12">Contact Sales</Button>
            <ul className="space-y-3 mt-auto">
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited Users</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Multi-Warehouse</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Custom API Access</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Dedicated Account Manager</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
