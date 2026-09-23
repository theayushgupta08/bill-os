"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiAssistant() {
  return (
    <section id="ai" className="py-24 md:py-32 bg-black text-white overflow-hidden relative">
      {/* Background glow specific to AI section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* AI Chat Interface Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-4 flex flex-col gap-4 aspect-square max-h-[600px] w-full"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">BillOS AI</div>
                <div className="text-xs text-zinc-400">Always active</div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-hidden flex flex-col gap-4 pt-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="self-end bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm"
              >
                What&apos;s my top-selling item this week?
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="self-start bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] text-sm"
              >
                <p className="mb-3">Your top item is <strong>Wireless Earbuds Pro</strong>.</p>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-500">Sales (This Week)</span>
                    <span className="text-xs text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />+24%</span>
                  </div>
                  <div className="text-lg font-mono text-zinc-100">142 units</div>
                </div>
                <p>You only have <strong>12 left</strong> in stock. Want me to draft a purchase order to Supplier X?</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 }}
                className="self-end bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm"
              >
                Yes, draft it for 100 units.
              </motion.div>
            </div>

            {/* Input Mockup */}
            <div className="mt-auto relative">
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-12 px-4 flex items-center text-zinc-500 text-sm">
                Ask anything about your business...
              </div>
              <div className="absolute right-2 top-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>BillOS AI</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-zinc-100">
              Your business analyst, working 24/7.
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Stop digging through spreadsheets to find answers. Ask questions in plain English and let BillOS AI generate reports, forecast inventory needs, and draft invoices instantly.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Natural language search across all data",
                "Automated low-stock purchasing drafts",
                "Instant P&L summarization",
                "Customer purchasing trend analysis"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <Button className="rounded-full bg-white text-black hover:bg-zinc-200">
              Explore AI Features
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
