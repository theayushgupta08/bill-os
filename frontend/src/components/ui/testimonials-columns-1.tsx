"use client";

import { useRef } from "react";
import Image from "next/image";
import { useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import * as m from "motion/react-m";

export interface Testimonial {
  quote: string;
  name: string;
  /** Job title and business, e.g. "Owner, Sharma Traders" */
  role: string;
  /** Photo in /public (e.g. "/testimonials/name.jpg"), used only with the person's permission; initials otherwise */
  image?: string;
}

interface TestimonialsColumnProps {
  testimonials: Testimonial[];
  /** Seconds for one full pass of the column */
  duration?: number;
  /** Stops the scroll, e.g. from the section's pause button */
  paused?: boolean;
  className?: string;
}

/**
 * One column of testimonial cards scrolling upwards in a seamless loop: the cards are rendered twice and the
 * column moves up by half its height, then wraps. The loop is driven frame by frame so it can pause (while the
 * column is hovered, or via `paused`) and resume where it stopped; it stands still for people who ask their OS for
 * reduced motion. Uses `m.div`, so it needs the `LazyMotion` provider the marketing layout sets up.
 */
export function TestimonialsColumn({ testimonials, duration = 10, paused = false, className }: TestimonialsColumnProps) {
  const progress = useMotionValue(0); // 0 → 1 over `duration` seconds, then wraps to 0
  const y = useTransform(progress, (p) => `${-50 * p}%`);
  const reduceMotion = useReducedMotion();
  const hovered = useRef(false);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || paused || hovered.current) return;
    progress.set((progress.get() + delta / 1000 / duration) % 1);
  });

  return (
    <div
      className={className}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      {/* gap-6 + pb-6: each copy is cards plus one gap each, so -50% lands exactly on the second copy */}
      <m.div style={{ y }} className="flex flex-col gap-6 pb-6">
        {[0, 1].map((copy) =>
          testimonials.map(({ quote, name, role, image }) => (
            <figure
              key={`${copy}-${name}`}
              // The second copy only exists for the loop; screen readers get each card once
              aria-hidden={copy === 1 || undefined}
              className="w-full max-w-xs rounded-2xl border border-border bg-card p-8 shadow-paper"
            >
              <blockquote className="leading-relaxed text-foreground">{quote}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {image ? (
                  <Image src={image} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-link"
                  >
                    {initials(name)}
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="font-medium leading-5 tracking-tight text-foreground">{name}</span>
                  <span className="text-sm leading-5 tracking-tight text-muted-foreground">{role}</span>
                </span>
              </figcaption>
            </figure>
          ))
        )}
      </m.div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
