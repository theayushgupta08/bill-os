import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger for siblings that enter together, in the same units as before (seconds, 0.05–0.1 steps). */
  delay?: number;
}

/**
 * Fades content up as it scrolls into view. Pure CSS (`.reveal` in globals.css, a scroll-driven
 * `view()` animation), so it needs no JS and the content is never hidden at rest: anything rendered
 * without scrolling — print, full-page captures, crawlers, browsers without scroll timelines, reduced
 * motion — just shows it. A scroll timeline has no clock, so `delay` shifts where the fade starts
 * (≈ 40px per 0.1 s) instead of when.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const style = delay ? ({ "--reveal-start": `${Math.round(delay * 400)}px` } as CSSProperties) : undefined;
  return (
    <div className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}
