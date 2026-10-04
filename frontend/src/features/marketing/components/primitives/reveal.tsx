"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { DURATION, EASE_OUT, REVEAL_OFFSET } from "../../motion-tokens";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds. Use small steps (0.06–0.1) when staggering siblings. */
  delay?: number;
}

/**
 * Fades content up as it enters the viewport, once. Uses the independent `y` transform rather than a
 * `transform` string so MotionConfig's reducedMotion="user" drops the movement and keeps only the fade.
 * Don't wrap above-the-fold content (it would delay the LCP).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: DURATION.reveal, delay, ease: EASE_OUT }}
    >
      {children}
    </m.div>
  );
}
