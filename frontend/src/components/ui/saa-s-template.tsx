import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Centered hero layout, adapted from the 21st.dev "SaaS template": an announcement pill, a centered headline and
 * lead, call-to-action buttons, then a large product preview underneath. Content comes in through slots, and
 * colours are the theme's semantic tokens, so it works on any surface (the marketing site's paper and ink tones,
 * or the dark app). The template's own header is left out — pages keep their site header.
 *
 * Server component: only what's passed in (e.g. an interactive preview) needs to be a client component.
 */
interface CenteredHeroProps {
  /** Short line above the headline, e.g. <HeroAnnouncement> */
  announcement?: ReactNode;
  title: ReactNode;
  /** Id for the headline, to label the section with */
  titleId?: string;
  description?: ReactNode;
  /** Buttons, centered in a row (stacked on phones) */
  actions?: ReactNode;
  /** Small print under the buttons */
  footnote?: ReactNode;
  /** The product preview below the copy */
  preview?: ReactNode;
  /** Decorative layer behind the preview (aria-hidden, pointer-events off) */
  backdrop?: ReactNode;
  className?: string;
}

export function CenteredHero({
  announcement,
  title,
  titleId,
  description,
  actions,
  footnote,
  preview,
  backdrop,
  className,
}: CenteredHeroProps) {
  return (
    <section aria-labelledby={titleId} className={cn("relative overflow-hidden", className)}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 text-center sm:px-8">
        {announcement}

        <h1
          id={titleId}
          className={cn(
            "max-w-4xl font-display text-[clamp(2.75rem,1.55rem+4.6vw,4.75rem)] leading-[1.02] font-normal tracking-[-0.025em] text-balance text-foreground",
            announcement ? "mt-8" : undefined
          )}
        >
          {title}
        </h1>

        {description && (
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-[1.1875rem]">
            {description}
          </p>
        )}

        {actions && <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">{actions}</div>}

        {footnote && <p className="mt-5 text-sm text-subtle">{footnote}</p>}

        {preview && (
          <div className="relative mt-14 w-full max-w-3xl text-left sm:mt-16">
            {backdrop && (
              <div aria-hidden className="pointer-events-none absolute -inset-x-[20%] -inset-y-16">
                {backdrop}
              </div>
            )}
            <div className="relative">{preview}</div>
          </div>
        )}
      </div>
    </section>
  );
}

interface HeroAnnouncementProps {
  children: ReactNode;
  href: string;
  /** Link text, e.g. "Read more" */
  linkLabel: string;
  className?: string;
}

/** The pill above a hero headline: a short announcement and a link to read more. */
export function HeroAnnouncement({ children, href, linkLabel, className }: HeroAnnouncementProps) {
  return (
    <p
      className={cn(
        "inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground sm:rounded-full",
        className
      )}
    >
      <span>{children}</span>
      <Link
        href={href}
        prefetch={false}
        className="group/announce inline-flex items-center gap-1 font-medium text-link hover:underline"
      >
        {linkLabel}
        <ArrowRight
          aria-hidden
          className="size-3 transition-transform duration-150 group-hover/announce:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </p>
  );
}
