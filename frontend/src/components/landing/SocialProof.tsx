"use client";

import { motion } from "framer-motion";

export function SocialProof() {
  return (
    <section className="py-10 border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-8">
          Trusted by 5,000+ fast-growing businesses across India
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Placeholder Logos for the "Vercel/Linear" aesthetic */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 group cursor-default"
            >
              <div className="w-8 h-8 rounded bg-foreground/20 group-hover:bg-primary transition-colors flex items-center justify-center">
                <div className="w-4 h-4 bg-background rounded-sm" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-foreground/80 group-hover:text-foreground transition-colors">
                Brand {i}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">₹500Cr+</span>
            <span>Invoices Processed</span>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">10M+</span>
            <span>Items Managed</span>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">99.99%</span>
            <span>Uptime SLA</span>
          </div>
        </div>
      </div>
    </section>
  );
}
