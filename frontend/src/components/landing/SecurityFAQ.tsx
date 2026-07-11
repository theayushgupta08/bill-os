"use client";

import { Shield, Lock, Server, FileCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my data safe in the cloud?",
    answer: "Absolutely. We use 256-bit AES encryption for all data at rest and in transit. Our servers are hosted on AWS with daily backups and multiple redundancies.",
  },
  {
    question: "Can I migrate my existing data from Tally or Vyapar?",
    answer: "Yes! We provide an automated 1-click import tool that pulls in your customers, inventory, and past invoices seamlessly.",
  },
  {
    question: "How does the AI Assistant work?",
    answer: "The AI Assistant is powered by secure LLMs trained to understand your business data without sharing it externally. It acts as a read-only query engine that can analyze your database, build charts, and draft emails or purchase orders.",
  },
  {
    question: "Is GST reporting automatic?",
    answer: "Yes. Every invoice you generate is automatically categorized into GSTR-1, GSTR-2, and GSTR-3B formats, ready to be exported for your CA.",
  },
  {
    question: "Do I need to install any software?",
    answer: "No. BillOS is 100% cloud-based. You can access it from any browser on your laptop, tablet, or phone.",
  },
];

export function SecurityFAQ() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Security Features */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Bank-grade security.</h2>
            <p className="text-lg text-muted-foreground mb-10">
              Your business data is your most valuable asset. We treat it with the highest level of security and compliance.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card">
                <Lock className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">256-bit Encryption</h3>
                <p className="text-sm text-muted-foreground">Military-grade encryption for data at rest and in transit.</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <Server className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">99.99% Uptime</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade infrastructure ensures your OS never goes down.</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <Shield className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Daily Backups</h3>
                <p className="text-sm text-muted-foreground">Automated multi-region backups so you never lose a single invoice.</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <FileCheck className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Role-based Access</h3>
                <p className="text-sm text-muted-foreground">Control exactly what your staff can see and do within the system.</p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg hover:text-primary">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
