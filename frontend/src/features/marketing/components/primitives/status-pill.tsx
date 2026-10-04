import { cn } from "@/lib/utils";

// Status colours follow docs/10-ui-ux-design-system.md §10.2 (paid = positive, partial = brand,
// awaiting = amber, overdue = red, draft/void = neutral).
const styles = {
  paid: "bg-positive-tint text-positive",
  partial: "bg-brand-tint text-link",
  issued: "bg-warning-tint text-warning",
  overdue: "bg-negative-tint text-negative",
  draft: "bg-muted text-muted-foreground",
} as const;

export type Status = keyof typeof styles;

export function StatusPill({ status, children, className }: { status: Status; children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium leading-4",
        styles[status],
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
