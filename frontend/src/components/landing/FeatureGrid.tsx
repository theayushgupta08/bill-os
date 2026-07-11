"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, PackageCheck, Wallet, Receipt, PieChart, BellRing } from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "GST Billing",
    description: "Generate e-invoices and E-way bills in 2 clicks. 100% compliant and ready for your accountant.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: PackageCheck,
    title: "Smart Inventory",
    description: "Real-time stock sync across multiple channels. Get low-stock alerts before you run out.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Wallet,
    title: "Payments & Expenses",
    description: "Auto-reconcile UPI and bank transfers. Track every rupee spent with zero manual entry.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: FileSpreadsheet,
    title: "CRM & Customers",
    description: "Know your best customers, their buying habits, and outstanding dues instantly.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: PieChart,
    title: "Advanced Reports",
    description: "Visual P&L, balance sheets, and tax reports. Export everything to Tally or Excel.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    description: "Get alerts for overdue invoices, pending tasks, and expiring stock on WhatsApp.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/50 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Powerful features. <br className="hidden sm:block" />
            <span className="text-muted-foreground">Without the complexity.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to run your business smoothly, packed into a beautiful interface.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-2xl border border-border bg-card p-8 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              {/* Vercel-style hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
