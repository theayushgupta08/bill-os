"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl";
  text?: string;
  showBrandText?: boolean;
  variant?: "fullscreen" | "page" | "card" | "inline";
  interactive?: boolean;
}

const sizeConfig = {
  sm: {
    container: "h-6 w-6",
    logoSize: 14,
    orbitRadius: 10,
    strokeWidth: 2,
    textSize: "text-xs",
  },
  default: {
    container: "h-10 w-10",
    logoSize: 22,
    orbitRadius: 16,
    strokeWidth: 2.5,
    textSize: "text-xs sm:text-sm",
  },
  lg: {
    container: "h-16 w-16",
    logoSize: 34,
    orbitRadius: 26,
    strokeWidth: 3,
    textSize: "text-sm sm:text-base",
  },
  xl: {
    container: "h-24 w-24",
    logoSize: 52,
    orbitRadius: 40,
    strokeWidth: 3.5,
    textSize: "text-base sm:text-lg",
  },
};

export function BrandLoader({
  size = "lg",
  text = "Loading...",
  showBrandText = false,
  variant = "card",
  interactive = true,
  className,
  ...props
}: BrandLoaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = sizeConfig[size] || sizeConfig.lg;

  // Variant outer containers
  const variantStyles = {
    fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md",
    page: "min-h-[50vh] w-full flex flex-col items-center justify-center py-12",
    card: "w-full min-h-[220px] flex flex-col items-center justify-center py-8",
    inline: "inline-flex items-center gap-2",
  };

  const isInline = variant === "inline";

  return (
    <div
      className={cn(variantStyles[variant], className)}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      {...props}
    >
      <div className={cn("relative flex items-center justify-center", isInline ? "" : "flex-col gap-4")}>
        {/* Glow backdrop aura */}
        <div
          className={cn(
            "absolute -inset-2 rounded-full blur-xl transition-all duration-700 pointer-events-none opacity-40",
            isHovered
              ? "bg-gradient-to-tr from-blue-500/60 via-teal-400/50 to-indigo-500/60 scale-125 opacity-70"
              : "bg-gradient-to-tr from-blue-600/30 via-teal-500/20 to-indigo-600/30 animate-pulse"
          )}
        />

        {/* Orbit Ring + Core Icon Container */}
        <div className={cn("relative flex items-center justify-center select-none", cfg.container)}>
          {/* Outer SVG Orbit Tracks */}
          <svg
            className={cn(
              "absolute inset-0 w-full h-full pointer-events-none",
              isHovered ? "animate-[spin_1.2s_linear_infinite]" : "animate-[spin_2.4s_linear_infinite]"
            )}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="billos-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0465DA" stopOpacity="1" />
                <stop offset="50%" stopColor="#04C8C6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="billos-counter-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#04C8C6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0465DA" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Static subtle guide track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20 dark:text-white/5"
            />

            {/* Primary glowing arc */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#billos-orbit-grad)"
              strokeWidth={cfg.strokeWidth * 1.6}
              strokeLinecap="round"
              strokeDasharray="180 100"
            />

            {/* Counter accent orbit particle */}
            <circle
              cx="50"
              cy="6"
              r={cfg.strokeWidth * 1.3}
              fill="#04C8C6"
              className="drop-shadow-[0_0_6px_#04C8C6]"
            />
          </svg>

          {/* Center Brand Monogram / Logo Mark */}
          <div
            className={cn(
              "relative z-10 flex items-center justify-center rounded-2xl bg-card border border-border/70 shadow-sm transition-all duration-300",
              isHovered ? "scale-105 shadow-md shadow-blue-500/20 border-blue-500/40" : "scale-100"
            )}
            style={{
              width: `${cfg.logoSize + 8}px`,
              height: `${cfg.logoSize + 8}px`,
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl p-1">
              <Image
                src="/billos.svg"
                alt="BillOS"
                width={cfg.logoSize}
                height={cfg.logoSize}
                className="object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)] select-none"
                priority
              />
            </div>
          </div>
        </div>

        {/* Text Area (Status + Brand) */}
        {(!isInline || text || showBrandText) && (
          <div className={cn("flex flex-col items-center text-center", isInline ? "items-start" : "mt-2")}>
            {showBrandText && (
              <span className="font-bold tracking-tight bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent text-sm sm:text-base mb-0.5">
                BillOS
              </span>
            )}

            {text && (
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs sm:text-sm">
                <span>{text}</span>
                {/* Micro-animated wave dots */}
                <span className="inline-flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-primary/70 animate-[bounce_1.4s_infinite_ease-in-out]" />
                  <span className="w-1 h-1 rounded-full bg-primary/70 animate-[bounce_1.4s_infinite_ease-in-out_0.2s]" />
                  <span className="w-1 h-1 rounded-full bg-primary/70 animate-[bounce_1.4s_infinite_ease-in-out_0.4s]" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Drop-in replacement for old standard Loader */
export function Loader({
  size = "default",
  text,
  className,
  ...props
}: {
  size?: "sm" | "default" | "lg" | "xl";
  text?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BrandLoader
      size={size}
      text={text}
      variant="inline"
      className={className}
      {...props}
    />
  );
}

/** Drop-in replacement for Page-level loader */
export function PageLoader({
  text = "Loading...",
  showBrandText = true,
}: {
  text?: string;
  showBrandText?: boolean;
}) {
  return (
    <BrandLoader
      variant="page"
      size="lg"
      text={text}
      showBrandText={showBrandText}
    />
  );
}

/** Drop-in replacement for Fullscreen / blocking loader */
export function FullPageLoader({
  text = "Setting up your workspace...",
  showBrandText = true,
}: {
  text?: string;
  showBrandText?: boolean;
}) {
  return (
    <BrandLoader
      variant="fullscreen"
      size="xl"
      text={text}
      showBrandText={showBrandText}
    />
  );
}

export default BrandLoader;
