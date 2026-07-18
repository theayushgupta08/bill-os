"use client";

import { motion } from "framer-motion";

export function SocialProof() {
  return (
    <section className="py-10 border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-8">
          Trusted by 5,000+ fast-growing businesses across India
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          {[
            { name: "Nexus", icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg> },
            { name: "Vertex", icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { name: "Omni", icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></svg> },
            { name: "Pulse", icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
            { name: "Aura", icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }
          ].map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <div className="text-foreground/70 group-hover:text-primary transition-colors">
                {brand.icon}
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground/70 group-hover:text-foreground transition-colors">
                {brand.name}
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
