"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  id: string;
  children: ReactNode;
}

/** Section heading for long-form pages, with a "copy link to this section" button beside it. */
export function DocumentHeading({ id, children, className, ...props }: DocumentHeadingProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the heading itself is still linkable
    }
  };

  return (
    <h2
      id={id}
      className={cn(
        "group/heading mt-2 mb-4 flex items-center gap-2 text-[1.375rem] leading-snug font-semibold tracking-[-0.01em] text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link to this section"}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-subtle opacity-0 transition-opacity group-hover/heading:opacity-100 hover:bg-sunken hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copied ? <Check aria-hidden className="size-4 text-positive" /> : <Link2 aria-hidden className="size-4" />}
      </button>
    </h2>
  );
}
