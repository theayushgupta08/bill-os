"use client";

import { motion } from "framer-motion";
import { Package, ShoppingCart, FileText, IndianRupee, BarChart3, Sparkles } from "lucide-react";

const steps = [
  { id: 1, label: "Inventory", icon: Package },
  { id: 2, label: "Purchases", icon: ShoppingCart },
  { id: 3, label: "Invoices", icon: FileText },
  { id: 4, label: "Payments", icon: IndianRupee },
  { id: 5, label: "Reports", icon: BarChart3 },
  { id: 6, label: "AI Insights", icon: Sparkles },
];

export function WorkflowTimeline() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Data flows seamlessly.
          </h2>
          <p className="text-lg text-muted-foreground">
            Enter information once and let BillOS propagate it across your entire business automatically.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 hidden md:block rounded-full overflow-hidden">
             <motion.div 
               className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent"
               animate={{ x: ["-100%", "100%"] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-4 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-4 relative group hover:border-primary/50 hover:shadow-primary/10 transition-all">
                  <step.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-semibold text-foreground">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
