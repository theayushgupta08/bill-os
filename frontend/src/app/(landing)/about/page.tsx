import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Users, BrainCircuit, Target, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: `About Us | ${siteConfig.name}`,
  description: "Learn about the mission, vision, and core values driving BillOS.",
};

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-background min-h-screen">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        
        {/* Header Section */}
        <div className="mb-20 md:text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
            Company
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
            About {siteConfig.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            We are building the intelligent operating system for modern business finance.
          </p>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          
          {/* Left Column: Story, Mission, Vision */}
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Story</h2>
              <div className="prose prose-lg prose-zinc dark:prose-invert text-muted-foreground max-w-none">
                <p>
                  {siteConfig.name} was born out of a shared frustration with legacy accounting systems. For decades, business software has forced operators to perform manual, repetitive data entry just to keep their financial records compliant. 
                </p>
                <p>
                  We realized that modern businesses don&apos;t need another complex database with a steep learning curve. They need an intelligent system that understands context, extracts data autonomously, and eliminates the friction between operations and accounting. We built {siteConfig.name} to bridge that gap.
                </p>
              </div>
            </section>

            <section className="grid sm:grid-cols-2 gap-8">
              <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-8 shadow-lg">
                <Target className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h3>
                <p className="text-muted-foreground">
                  To automate the repetitive financial workflows for small and medium businesses, giving operators their time back to focus on growth.
                </p>
              </div>
              <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-8 shadow-lg">
                <Zap className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h3>
                <p className="text-muted-foreground">
                  A future where accounting is proactive rather than reactive, operating silently in the background with zero manual intervention.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Why {siteConfig.name}?</h2>
              <div className="prose prose-lg prose-zinc dark:prose-invert text-muted-foreground max-w-none">
                <p>
                  Traditional ERPs are bloated, expensive, and require months of implementation. Spreadsheets are flexible but lack structure, leading to costly errors and compliance risks. 
                </p>
                <p>
                  {siteConfig.name} offers a pragmatic alternative. We combine the flexibility of modern SaaS interfaces with the strict data integrity required for tax compliance and accounting. Our architecture is designed for speed, allowing businesses to generate invoices, track inventory, and file taxes within a single, cohesive workflow.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8 text-foreground">Core Values</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Pragmatic AI", desc: "We use AI to solve real problems, not as a marketing gimmick. If standard logic works better, we use standard logic." },
                  { title: "Data Integrity First", desc: "Speed matters, but accuracy is paramount. We architect our systems to ensure your financial records are always compliant." },
                  { title: "Uncompromising UI", desc: "Enterprise software shouldn't look like it was built in the 90s. We believe in consumer-grade aesthetics." },
                  { title: "Radical Transparency", desc: "No hidden fees, no opaque algorithms. We build trust by being transparent about how our systems work." }
                ].map((value, idx) => (
                  <div key={idx} className="flex gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground text-lg mb-2">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">{value.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Philosophies & Roadmap */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-muted/50 to-transparent dark:from-white/5 dark:to-transparent border border-border/50 rounded-2xl p-8 relative overflow-hidden">
              <BrainCircuit className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3 text-foreground">AI-first Philosophy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In {siteConfig.name}, AI isn&apos;t an afterthought bolted onto an existing codebase. It is the core engine. From extracting line items on vendor bills to categorizing expenses in real-time, our machine learning models reduce manual labor so your team can focus on strategy.
              </p>
            </div>

            <div className="bg-gradient-to-br from-muted/50 to-transparent dark:from-white/5 dark:to-transparent border border-border/50 rounded-2xl p-8 relative overflow-hidden">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3 text-foreground">Security Commitment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We handle your business&apos;s most sensitive data. Our infrastructure enforces strict tenant isolation, at-rest encryption (AES-256), and continuous audit logging. We treat security as a fundamental engineering requirement, not a feature.
              </p>
            </div>

            <div className="bg-gradient-to-br from-muted/50 to-transparent dark:from-white/5 dark:to-transparent border border-border/50 rounded-2xl p-8 relative overflow-hidden">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3 text-foreground">Customer Focus</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We build software for the operators—the accountants, inventory managers, and founders who live in these systems every day. Our roadmap is driven by user feedback, ensuring we solve the granular challenges of day-to-day business operations.
              </p>
            </div>

            <div className="border border-border/50 rounded-2xl p-8 bg-background">
              <h3 className="text-xl font-bold mb-4 text-foreground">Future Roadmap</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  Multi-currency processing
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  Advanced Predictive Analytics
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  Open Banking API Integrations
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  Automated Tax Filing Pipelines
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-24 bg-gradient-to-tr from-primary/10 via-background to-primary/5 border border-primary/20 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 relative z-10">
            Ready to streamline your financial operations?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">
            Join the businesses that are scaling efficiently with our intelligent billing and inventory infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
              <a href={`mailto:${siteConfig.company.supportEmail.replace(/[\[\]]/g, '')}`}>
                Contact Our Team
              </a>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
