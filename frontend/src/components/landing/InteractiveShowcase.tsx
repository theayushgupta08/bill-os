"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Package, Users, Sparkles } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", label: "GST Invoices", icon: FileText },
  { id: "inventory", label: "Smart Inventory", icon: Package },
  { id: "crm", label: "CRM", icon: Users },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
];

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need. <span className="text-muted-foreground">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A cohesive suite of tools designed to work together perfectly. Say goodbye to scattered spreadsheets and clunky interfaces.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-muted border border-border/50 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive && tab.id === 'ai' ? 'text-primary' : ''}`} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Display */}
        <div className="relative mx-auto max-w-5xl aspect-[16/10] md:aspect-[16/9] rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-background/50 to-muted/50"
            >
              {/* Abstract Representation of the Module */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background border border-border shadow-lg mb-6">
                  {activeTab === "dashboard" && <LayoutDashboard className="h-10 w-10 text-muted-foreground" />}
                  {activeTab === "invoices" && <FileText className="h-10 w-10 text-blue-500" />}
                  {activeTab === "inventory" && <Package className="h-10 w-10 text-orange-500" />}
                  {activeTab === "crm" && <Users className="h-10 w-10 text-green-500" />}
                  {activeTab === "ai" && <Sparkles className="h-10 w-10 text-primary" />}
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  {TABS.find(t => t.id === activeTab)?.label} Experience
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Interactive high-fidelity UI representation goes here. Imagine beautiful charts, data tables with sticky headers, and glassmorphic panels.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
