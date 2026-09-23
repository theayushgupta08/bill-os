"use client";

const integrations = [
  "Razorpay", "WhatsApp", "Shopify", "WooCommerce", 
  "Excel", "Google Sheets", "Tally", "Gmail", 
  "Slack", "Stripe", "PayPal", "Mailchimp"
];

export function IntegrationMarquee() {
  return (
    <section className="py-20 border-y border-border/40 bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          Plays nice with your existing tools.
        </h2>
        <p className="text-muted-foreground">
          Import, export, and sync data seamlessly with the software you already use.
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        {/* Gradient Masks for smooth fading edges */}
        <div className="absolute top-0 left-0 bottom-0 w-32 z-10 bg-gradient-to-r from-zinc-50 dark:from-[#0a0a0a] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-32 z-10 bg-gradient-to-l from-zinc-50 dark:from-[#0a0a0a] to-transparent pointer-events-none" />

        <div className="flex animate-marquee group-hover:[animation-play-state:paused] gap-4 py-4 pr-4">
          {[...integrations, ...integrations].map((name, i) => (
            <div
              key={i}
              className="flex-none flex items-center justify-center px-8 py-4 rounded-xl border border-border bg-card shadow-sm text-sm font-semibold hover:border-primary/50 transition-colors cursor-default"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
