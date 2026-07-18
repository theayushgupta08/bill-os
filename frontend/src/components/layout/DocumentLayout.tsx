"use client"; // Needs client context for smooth scrolling interactions on active section if we want later, or just keep it simple.

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface DocumentSection {
  id: string;
  title: string;
}

interface DocumentLayoutProps {
  title: string;
  lastUpdated?: string;
  badgeText?: string;
  sections: DocumentSection[];
  children: React.ReactNode;
}

export function DocumentLayout({
  title,
  lastUpdated,
  badgeText,
  sections,
  children,
}: DocumentLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  // Optional: Intersection observer to highlight active TOC item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Find the top-most visible section
          const topEntry = visibleEntries.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current;
          });
          setActiveSection(topEntry.target.id);
        }
      },
      {
        rootMargin: "-100px 0px -60% 0px", // Trigger when heading is near the top third
        threshold: 1.0,
      }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="mb-16 md:text-center max-w-3xl mx-auto">
          {badgeText && (
            <div className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
              {badgeText}
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-xl text-muted-foreground">
              Last Updated: <span className="font-semibold text-foreground/80">{lastUpdated}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 relative">
          {/* Sticky Table of Contents */}
          {sections.length > 0 && (
            <aside className="lg:w-1/4 hidden lg:block shrink-0">
              <div className="sticky top-32 rounded-2xl p-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl">
                <h3 className="font-bold text-lg mb-6 text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Table of Contents
                </h3>
                <nav className="space-y-3 relative before:absolute before:inset-y-0 before:left-[3px] before:w-[2px] before:bg-border/50">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={cn(
                        "block relative pl-5 text-sm font-medium transition-all duration-300 before:absolute before:left-[-1px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:transition-colors",
                        activeSection === section.id
                          ? "text-primary translate-x-1 before:bg-primary"
                          : "text-muted-foreground hover:text-primary hover:translate-x-1 before:bg-transparent hover:before:bg-primary/50"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                        });
                        // Update URL hash without jumping
                        window.history.pushState(null, "", `#${section.id}`);
                        setActiveSection(section.id);
                      }}
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Content */}
          <main className="lg:w-3/4 prose prose-lg prose-zinc dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground pb-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
