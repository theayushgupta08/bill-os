"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { EASE_OUT } from "./motion-tokens";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Motion for the marketing site. `LazyMotion` + `m` components keep the initial bundle at ~4.6 kb
 * and fetch the animation features after first render; `strict` throws if a full `motion.*`
 * component sneaks in. `reducedMotion="user"` turns transform animations into plain fades for people
 * who ask their OS for reduced motion.
 */
export function MarketingMotion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE_OUT }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
