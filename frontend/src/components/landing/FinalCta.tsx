"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function FinalCta() {
  return (
    <section className="py-32 relative overflow-hidden bg-black text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/40 blur-[150px] rounded-t-full pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Ready to upgrade your business?
        </h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Join thousands of modern businesses running on BillOS. Get started in minutes, no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="rounded-full h-14 px-10 text-lg bg-white text-black hover:bg-zinc-200 w-full sm:w-auto">
            <Link href="/register">Start 14-Day Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full h-14 px-10 text-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white w-full sm:w-auto bg-transparent">
            Talk to Sales <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
