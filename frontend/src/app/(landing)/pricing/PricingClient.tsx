"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingClient() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter",
      description: "Perfect for freelancers and small businesses.",
      priceMonthly: "₹999",
      priceAnnual: "₹799",
      features: [
        "Up to 50 e-Invoices / month",
        "Basic GST reporting",
        "1 User account",
        "Email support",
        "Standard templates",
      ],
      notIncluded: [
        "AI Assistant",
        "Multi-warehouse inventory",
        "API Access",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      description: "Ideal for growing businesses needing automation.",
      priceMonthly: "₹2,499",
      priceAnnual: "₹1,999",
      features: [
        "Unlimited e-Invoices",
        "Advanced GST filing integration",
        "Up to 5 User accounts",
        "Priority 24/7 support",
        "Custom branding",
        "AI Expense categorization",
        "Basic inventory management",
      ],
      notIncluded: [
        "Dedicated account manager",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      description: "For large scale operations and custom workflows.",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      features: [
        "Everything in Pro",
        "Unlimited Users",
        "Dedicated Account Manager",
        "Full API & Webhooks Access",
        "Custom integrations",
        "Multi-warehouse advanced inventory",
        "SLA Guarantee",
      ],
      notIncluded: [],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Pricing Toggle */}
      <div className="flex items-center gap-3 mb-16 p-1 bg-muted/50 backdrop-blur-md border border-border/50 rounded-full relative z-10 shadow-sm">
        <button
          onClick={() => setIsAnnual(false)}
          className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            !isAnnual ? "text-foreground shadow-md bg-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            isAnnual ? "text-foreground shadow-md bg-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annually
          <span className="absolute -top-3 -right-2 bg-primary/20 text-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-primary/30">
            Save 20%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mb-24 relative z-10">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${
              tier.highlighted
                ? "bg-background border-2 border-primary shadow-2xl scale-105 z-10"
                : "bg-muted/20 border border-border/50 shadow-lg hover:shadow-xl"
            }`}
          >
            {tier.badge && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                {tier.badge}
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">
                  {isAnnual ? tier.priceAnnual : tier.priceMonthly}
                </span>
                {tier.priceMonthly !== "Custom" && (
                  <span className="text-sm font-medium text-muted-foreground">/mo</span>
                )}
              </div>
              {tier.priceMonthly !== "Custom" && isAnnual && (
                <p className="text-xs text-primary font-medium mt-2">Billed annually</p>
              )}
            </div>

            <Button
              variant={tier.highlighted ? "default" : "outline"}
              className={`w-full rounded-full h-12 text-base font-semibold mb-8 ${
                tier.highlighted ? "shadow-lg shadow-primary/25" : ""
              }`}
            >
              {tier.cta}
            </Button>

            <div className="flex-1 space-y-4">
              <p className="text-sm font-semibold text-foreground">What&apos;s included:</p>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.notIncluded.length > 0 && (
                <>
                  <div className="border-t border-border/50 my-4"></div>
                  <ul className="space-y-3">
                    {tier.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground/50 line-through">
                        <CheckCircle2 className="w-5 h-5 opacity-0 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
