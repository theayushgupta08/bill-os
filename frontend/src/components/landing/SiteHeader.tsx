"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_KEY, useCurrentUser } from "@/lib/use-current-user";

export function SiteHeader() {
  const queryClient = useQueryClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;
  const userName = currentUser?.name ?? "";
  const userAvatar = currentUser?.avatarUrl ?? "";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Drop any leftover token from the pre-Supabase auth flow so it doesn't pollute the browser
    localStorage.removeItem("token");

    // Sign-in/sign-out in this or another tab: refresh the cached user instead of tracking it by hand
    const { data: { subscription } } = createClient().auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

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
              <Link prefetch={false} href="/" className="flex items-center gap-2">
                <Image src={siteConfig.logo} alt={`${siteConfig.name} logo`} width={32} height={32} className="rounded-lg" />
                <span className="text-xl font-bold tracking-tight">{siteConfig.name}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                    Product <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform" />
                  </button>
                  
                  {/* Mega Menu Container */}
                  <div className="absolute top-full -left-1/2 mt-2 w-[600px] rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1 transition-all duration-300">
                    <div className="grid grid-cols-3 gap-6">
                      
                      {/* Left Column: Features */}
                      <div className="col-span-2 space-y-5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Core Platform</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link prefetch={false} href="/features#billing" className="group/item flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                            <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">GST Billing</div>
                              <div className="text-xs text-muted-foreground leading-snug mt-1">Automated tax calculations & compliant e-invoices</div>
                            </div>
                          </Link>
                          
                          <Link prefetch={false} href="/features#inventory" className="group/item flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                            <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">Inventory</div>
                              <div className="text-xs text-muted-foreground leading-snug mt-1">Real-time stock tracking across multiple locations</div>
                            </div>
                          </Link>
                          
                          <Link prefetch={false} href="/features#integrations" className="group/item flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                            <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">Integrations</div>
                              <div className="text-xs text-muted-foreground leading-snug mt-1">Connect with Razorpay, Stripe, WhatsApp & Tally</div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Right Column: Featured (AI) */}
                      <div className="col-span-1 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 border border-primary/10 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary mb-3">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            New Feature
                          </div>
                          <h4 className="text-sm font-bold text-foreground mb-1">BillOS AI Assistant</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Let our AI categorize your expenses, forecast your cash flow, and automatically match transactions in seconds.
                          </p>
                        </div>
                        
                        <Link prefetch={false} href="/features#ai" className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 mt-4 group/btn">
                          Discover AI capabilities <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
                <Link prefetch={false} href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Solutions
                </Link>
                <Link prefetch={false} href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <Link prefetch={false} href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2">
                    <Link prefetch={false} href="/dashboard">
                      <Avatar className="size-4 after:hidden">
                        {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                        {/* Shown when there is no avatar or the provider's image fails to load */}
                        <AvatarFallback className="bg-transparent text-current">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></svg>
                        </AvatarFallback>
                      </Avatar>
                      <span>{userName || "Dashboard"}</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link prefetch={false} href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Log in
                  </Link>
                  <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Link prefetch={false} href="/register">Start Free Trial</Link>
                  </Button>
                </>
              )}
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
              <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
              {isLoggedIn ? (
                <Link href="/dashboard" className="text-primary font-bold" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              ) : (
                <Link href="/login" className="text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              )}
            </nav>
            <div className="pt-6 border-t border-border">
              {isLoggedIn ? (
                <Button asChild className="w-full rounded-full text-lg h-14" onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard">Go to Dashboard ({userName}) <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              ) : (
                <Button asChild className="w-full rounded-full text-lg h-14" onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/register">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
