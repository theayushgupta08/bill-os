"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, Eyebrow } from "./primitives/layout";

export interface DocumentSection {
  id: string;
  title: string;
}

interface DocumentLayoutProps {
  title: string;
  badgeText?: string;
  lastUpdated?: string;
  sections: DocumentSection[];
  children: ReactNode;
}

/** Long-form pages (security, privacy, terms, refunds): sticky contents on desktop, a disclosure on phones. */
export function DocumentLayout({ title, badgeText, lastUpdated, sections, children }: DocumentLayoutProps) {
  const active = useActiveSection(sections);

  return (
    <>
      <section className="border-b border-border pt-12 pb-12 sm:pt-16 lg:pt-20 lg:pb-16">
        <Container>
          {badgeText && <Eyebrow className="mb-5">{badgeText}</Eyebrow>}
          <h1 className="max-w-3xl font-display text-[clamp(2.5rem,1.6rem+3.6vw,4.25rem)] leading-[1.04] font-normal tracking-[-0.022em] text-balance text-foreground">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-5 text-sm text-subtle">
              Last updated <time className="text-muted-foreground">{lastUpdated}</time>
            </p>
          )}
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
        {sections.length > 0 && (
          <aside className="lg:col-span-3">
            {/* Phones/tablets: collapsible contents */}
            <details className="group rounded-[10px] border border-border bg-card lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown aria-hidden className="size-4 text-subtle transition-transform group-open:rotate-180" />
              </summary>
              <TocLinks sections={sections} active={active} className="border-t border-border px-2 py-2" />
            </details>

            <nav aria-label="On this page" className="sticky top-28 hidden lg:block">
              <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-subtle">On this page</p>
              <TocLinks sections={sections} active={active} />
            </nav>
          </aside>
        )}

        <article className="doc-prose max-w-[68ch] lg:col-span-8">{children}</article>
      </Container>
    </>
  );
}

function TocLinks({ sections, active, className }: { sections: DocumentSection[]; active: string; className?: string }) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {sections.map((section) => {
        const isActive = active === section.id;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isActive
                  ? "border-primary bg-brand-tint/60 font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {section.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** The section whose heading most recently crossed the top third of the viewport. */
function useActiveSection(sections: DocumentSection[]) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActive(topmost.target.id);
      },
      { rootMargin: "-96px 0px -60% 0px" }
    );
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return active;
}
