"use client";

import { Star } from "lucide-react";

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/30 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Loved by operators.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-lg mb-6 text-foreground">
              &quot;I used to spend 4 hours a day on GST filing and inventory tracking. BillOS reduced that to 15 minutes. The AI assistant is basically a free employee.&quot;
            </p>
            <div>
              <div className="font-semibold">Rahul Sharma</div>
              <div className="text-sm text-muted-foreground">Owner, Metro Pharmacy</div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-lg mb-6 text-foreground">
              &quot;We switched from a legacy ERP that took months to learn. Our staff learned BillOS in 20 minutes. The UI is incredibly fast and intuitive.&quot;
            </p>
            <div>
              <div className="font-semibold">Priya Patel</div>
              <div className="text-sm text-muted-foreground">Director, TechNova Distributors</div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-lg mb-6 text-foreground">
              &quot;The ability to generate an E-way bill directly from the invoice screen without switching portals is a game-changer for our logistics.&quot;
            </p>
            <div>
              <div className="font-semibold">Amit Singh</div>
              <div className="text-sm text-muted-foreground">Operations Manager, BuildRight</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
