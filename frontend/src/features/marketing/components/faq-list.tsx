"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Faq } from "../content/faqs";

/**
 * Base UI Accordion: a real <button> per question with aria-expanded/aria-controls, keyboard support,
 * and a panel height Base UI measures into --accordion-panel-height so it can transition smoothly.
 */
export function FaqList({ items, className }: { items: Faq[]; className?: string }) {
  return (
    <Accordion.Root className={cn("border-t border-border", className)}>
      {items.map((item) => (
        <Accordion.Item key={item.question} value={item.question} className="border-b border-border">
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                "group/faq flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left text-base font-medium text-foreground sm:text-[1.0625rem]",
                "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              )}
            >
              {item.question}
              <span
                aria-hidden
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-input text-muted-foreground transition-[rotate,background-color,color] duration-200 ease-ledger group-hover/faq:text-foreground group-data-[panel-open]/faq:rotate-45 group-data-[panel-open]/faq:bg-foreground group-data-[panel-open]/faq:text-background motion-reduce:transition-none"
              >
                <Plus className="size-3.5" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-300 ease-ledger data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
            <p className="max-w-[62ch] pr-10 pb-6 leading-relaxed text-muted-foreground">{item.answer}</p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
