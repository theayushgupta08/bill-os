"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  id: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export function DocumentHeading({
  id,
  level = 2,
  children,
  className,
  ...props
}: DocumentHeadingProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = new URL(window.location.href);
    url.hash = id;
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tag = `h${level}` as React.ElementType;

  return (
    <Tag
      id={id}
      className={cn(
        "group flex items-center gap-2 text-foreground font-bold scroll-mt-32 relative",
        level === 1 && "text-4xl mb-6",
        level === 2 && "text-2xl mb-4",
        level === 3 && "text-xl mb-3",
        level === 4 && "text-lg mb-2",
        className
      )}
      {...props}
    >
      <button
        onClick={copyLink}
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground hidden md:flex items-center justify-center"
        aria-label="Copy link to heading"
        title="Copy link to heading"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
      </button>
      {children}
    </Tag>
  );
}
