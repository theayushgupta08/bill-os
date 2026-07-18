"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-40 transition-all duration-300">
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            isScrolled ? "py-2" : "py-4"
          }`}
        >
          <div
            className={`flex items-center justify-between rounded-full px-6 py-3 transition-all duration-300 bg-background/60 backdrop-blur-xl border border-border/50 ${
              isScrolled
                ? "shadow-lg"
                : "shadow-sm"
            }`}
          >
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Image src={siteConfig.logo} alt={`${siteConfig.name} logo`} width={32} height={32} className="rounded-lg" />
                <span className="text-xl font-bold tracking-tight">{siteConfig.name}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                    Product <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="flex flex-col gap-3">
                      <Link href="#billing" className="group/item flex flex-col gap-1 rounded-lg p-2 hover:bg-muted transition-colors">
                        <span className="text-sm font-semibold group-hover/item:text-primary transition-colors">GST Billing</span>
                        <span className="text-xs text-muted-foreground">Fast, compliant e-invoices</span>
                      </Link>
                      <Link href="#inventory" className="group/item flex flex-col gap-1 rounded-lg p-2 hover:bg-muted transition-colors">
                        <span className="text-sm font-semibold group-hover/item:text-primary transition-colors">Smart Inventory</span>
                        <span className="text-xs text-muted-foreground">Real-time stock tracking</span>
                      </Link>
                    </div>
                  </div>
                </div>
                <Link href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Solutions
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </div>

            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-background/95 backdrop-blur-xl md:hidden pt-32 px-6 pb-6 flex flex-col"
          >
            <nav className="flex flex-col gap-6 text-xl font-semibold mb-auto">
              <Link href="#product" onClick={() => setIsMobileMenuOpen(false)}>Product</Link>
              <Link href="#solutions" onClick={() => setIsMobileMenuOpen(false)}>Solutions</Link>
              <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            </nav>
            <div className="pt-6 border-t border-border">
              <Button asChild className="w-full rounded-full text-lg h-14" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/register">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
