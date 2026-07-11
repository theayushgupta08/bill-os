"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Search, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy */}
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Run your entire <br className="hidden lg:block" />
                business. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Beautifully.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              GST billing, smart inventory, CRM, and an AI assistant—all in one lightning-fast platform designed for growth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Button size="lg" className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all w-full sm:w-auto group">
                Start your free trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base w-full sm:w-auto bg-background/50 backdrop-blur-sm hidden sm:flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground border border-border rounded px-1.5 py-0.5 text-xs font-mono">S</span>
                <span>to search or Book Demo</span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Setup in 2 minutes</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Animated Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15, rotateX: 5 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative lg:ml-auto w-full max-w-[600px] perspective-[2000px] hidden md:block mx-auto"
          >
            <div className="relative rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
              {/* Abstract Dashboard Representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-90" />
              <div className="absolute top-4 left-4 right-4 h-12 border-b border-border/50 flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              
              <div className="relative w-full h-full pt-20 p-6 flex flex-col gap-4">
                <div className="flex gap-4">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-1 h-24 rounded-xl border border-border/50 bg-card shadow-sm p-4 flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-4 h-4 text-primary">$</div>
                    </div>
                    <div className="h-2 w-16 bg-muted rounded" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="flex-1 h-24 rounded-xl border border-border/50 bg-card shadow-sm p-4 flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <div className="w-4 h-4 text-blue-500">📦</div>
                    </div>
                    <div className="h-2 w-16 bg-muted rounded" />
                  </motion.div>
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card shadow-sm p-4 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-primary/10 to-transparent" />
                  <svg className="w-full h-full text-primary opacity-50" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <motion.path 
                      d="M0,40 C20,30 40,40 60,20 C80,0 100,20 100,20 L100,40 L0,40 Z" 
                      fill="currentColor" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              </div>

              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 top-1/3 rounded-xl border border-border/50 bg-background/80 backdrop-blur-md p-4 shadow-xl hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Invoice Paid</div>
                    <div className="text-xs text-muted-foreground">₹45,000 via UPI</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
