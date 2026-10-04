import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The page grid: 1200px max, 20px gutters on phones, 32px from `sm`. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)} {...props} />;
}

const tones = {
  paper: "",
  sunken: "bg-sunken",
  /** Navy band. Re-points the semantic tokens, so children need no special styling. */
  inverse: "tone-inverse bg-background text-foreground",
} as const;

export type SectionTone = keyof typeof tones;

interface SectionProps extends ComponentProps<"section"> {
  tone?: SectionTone;
  /** Drop the default vertical rhythm, e.g. for a hero that sets its own. */
  flush?: boolean;
}

export function Section({ tone = "paper", flush = false, className, ...props }: SectionProps) {
  return (
    <section
      className={cn(!flush && "py-20 sm:py-24 lg:py-32", tones[tone], className)}
      {...props}
    />
  );
}

/** Mono overline that labels a section — a short rule, then the label. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-subtle",
        className
      )}
    >
      <span aria-hidden className="h-px w-5 bg-rule-strong" />
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Heading = "h2",
  id,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className={cn("mb-5", centered && "justify-center")}>{eyebrow}</Eyebrow>}
      <Heading
        id={id}
        className={cn(
          "font-display font-normal text-balance text-foreground",
          Heading === "h1"
            ? "text-[clamp(2.5rem,1.6rem+3.6vw,4.25rem)] leading-[1.04] tracking-[-0.022em]"
            : "text-[clamp(2rem,1.45rem+2.2vw,3.25rem)] leading-[1.08] tracking-[-0.018em]"
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            "mt-5 text-pretty text-lg leading-relaxed text-muted-foreground",
            centered ? "mx-auto max-w-[58ch]" : "max-w-[58ch]"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
