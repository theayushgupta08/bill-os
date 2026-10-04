import type { ComponentProps } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marketing buttons. Separate from components/ui/button (the dense dashboard control): these are
 * at least 44px tall for touch, and only use semantic tokens so they adapt to the ink tone.
 */
export const buttonStyles = cva(
  [
    "group/btn inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium",
    "transition-[background-color,border-color,color,box-shadow,translate] duration-150 ease-ledger",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(14_26_51/0.18)] hover:bg-brand-hover",
        secondary: "border border-input bg-card text-foreground hover:border-rule-strong hover:bg-sunken",
        ghost: "text-foreground hover:bg-sunken",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-[0.9375rem]",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonStyles> & {
    /** Trailing arrow that nudges right on hover — for "go somewhere" actions only. */
    arrow?: boolean;
  };

export function ButtonLink({ variant, size, arrow, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link prefetch={false} className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform duration-150 ease-ledger group-hover/btn:translate-x-0.5"
        />
      )}
    </Link>
  );
}

/** Inline text link with an arrow, for "Learn more" style navigation inside copy. */
export function ArrowLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      prefetch={false}
      className={cn(
        "group/link inline-flex items-center gap-1.5 rounded-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    >
      {children}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-150 ease-ledger group-hover/link:translate-x-0.5"
      />
    </Link>
  );
}
