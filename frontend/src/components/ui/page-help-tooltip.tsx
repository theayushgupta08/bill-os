"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageHelpTooltipProps {
  title?: string;
  description: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function PageHelpTooltip({
  title,
  description,
  className,
  side = "right",
}: PageHelpTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        delay={100}
        closeOnClick={false}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1 text-muted-foreground/60 hover:text-indigo-400 hover:bg-slate-800/60 focus:bg-slate-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-help",
          open && "text-indigo-400 bg-slate-800/60",
          className
        )}
        aria-label={title ? `Help: ${title}` : "Page Information"}
      >
        <Info className="w-4 h-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        sideOffset={8}
        className="max-w-xs p-3 text-xs leading-relaxed border border-slate-700/80 bg-slate-950/95 backdrop-blur-md shadow-2xl z-[9999]"
      >
        {title && (
          <div className="font-semibold text-slate-100 text-xs mb-1">
            {title}
          </div>
        )}
        <div className="text-slate-300 font-normal">{description}</div>
      </TooltipContent>
    </Tooltip>
  );
}
