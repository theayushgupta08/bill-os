# Design System: BillOS — "Ledger" (marketing site)

> Global source of truth for the public website (`frontend/src/app/(landing)`). Page files in
> `pages/` override this one. The **app** (dashboard, auth) is a separate dark theme and is not
> governed here — see `docs/10-ui-ux-design-system.md`.
>
> Tokens live in `frontend/src/app/globals.css` (`.site-light`, `.site-light .tone-inverse`);
> components in `frontend/src/features/marketing/`. Change the tokens there, then this file.

## Provenance

Generated with UI UX Pro Max (`--design-system "B2B fintech invoicing accounting SaaS trustworthy"
--variance 4 --motion 4 --density 3`), then verified against the product and the project PRD.

| Skill output | Decision | Why |
|---|---|---|
| Pattern: Hero + Features + CTA; landing search → *Product Demo + Features* | **Kept** | The product itself is the demo: an interactive GST invoice in the hero, real screens in the tour |
| "Avoid: dark mode by default" | **Kept** | Marketing site is light (paper); the app stays dark |
| Palette: *Invoice & Billing Tool* (navy / blue / paid-green, off-white bg) | **Kept, re-stepped** | Re-stepped to the logo's blue and teal and checked for ≥ 4.5:1 |
| Style: Glassmorphism | **Overridden → Minimalism & Swiss** | Brief asked for no generic AI-site gradients; Swiss result fits a ledger |
| Accent CTA orange `#EA580C` | **Overridden** | One primary action per screen; brand blue only |
| Font: Plus Jakarta Sans | **Overridden** | PRD fonts kept (Inter, JetBrains Mono) + Newsreader for display |
| Motion: GSAP stagger with `back.out` | **Overridden** | Motion for React; no overshoot on financial UI |

## Concept

A well-kept ledger: warm paper, navy ink, hairline rules, tabular rupee figures. Documents are
paper (light); the app's screens are ink (dark). Copy only claims what the product ships.

## Colors

All text pairs measured; ratios are against the surface they sit on.

| Role | Token | Hex | Notes |
|---|---|---|---|
| Background (paper) | `--background` | `#F7F6F2` | |
| Sunken band | `--sunken` / `--muted` | `#EFEDE6` | alternate section tone |
| Card / document | `--card` | `#FFFFFF` | |
| Ink | `--foreground` | `#0E1A33` | 16.0:1 on paper |
| Ink 2 (body) | `--muted-foreground` | `#44506A` | 7.5:1 |
| Ink 3 (meta) | `--subtle` | `#5F677B` | 5.2:1 on paper, 4.8:1 on sunken |
| Rule | `--border` | `#E0DCD1` | hairlines only |
| Rule strong | `--rule-strong` | `#C9C4B6` | track lines, emphasis rules |
| Primary (brand) | `--primary` | `#1D4FD7` | white text 6.7:1; hover `#1842B8` |
| Link | `--link` | `#1D4FD7` (ink tone `#7FA2FF`, 7.0:1) | |
| Positive (paid) | `--positive` | `#0A7068` | from the logo teal; fill-only `#14B8A6` |
| Warning (issued/due) | `--warning` | `#A45207` | 5.1:1 |
| Negative (overdue) | `--negative` | `#B42318` | 6.1:1 |
| Ink tone | `.tone-inverse` | bg `#0E1A33`, text `#F7F6F2`, muted `#A9B4CC` (8.3:1) | navy bands, product screens, featured plan |

Status mapping follows the PRD (§10.2): paid → positive, partial → brand, issued → amber,
overdue → red, draft → neutral. Status always carries a text label, never colour alone.

## Typography

| Role | Font | Spec |
|---|---|---|
| Display (h1/h2) | Newsreader (variable, `opsz`), `next/font`, landing layout only | 400; h1 `clamp(2.5rem…4.25rem)`/1.04/−0.022em; hero `…4.75rem` |
| UI / body | Inter (app-wide) | body 16–18px / 1.6–1.75; h3 600 |
| Figures & labels | JetBrains Mono | `tabular-nums`; ₹ amounts in en-IN grouping (`₹18,42,600`) |
| Eyebrow | JetBrains Mono 12px, uppercase, 0.08em, ink-3, preceded by a 20px rule | |

Inputs are 16px so iOS never zooms on focus. Headings use `text-balance`, body `text-pretty`.

## Layout & spacing

- Container 1200px, gutters 20px (phone) / 32px (≥ 640). 4px spacing grid.
- Section rhythm `py-20 / sm:py-24 / lg:py-32`; tones alternate paper → sunken → ink.
- Radius: 10px controls, 14px cards/documents, full only for pills.
- Elevation: hairline borders first. Two shadows only: `shadow-paper` (documents), `shadow-float`.
- Breakpoints: 375 / 640 / 1024 / 1280. Desktop nav from `lg`; below that a full-height menu.
- Touch targets ≥ 44px (buttons `h-11`/`h-12`, toggles `h-10`).

## Motion (Motion for React)

- `LazyMotion` + `m` with lazily-loaded `domAnimation` (~4.6 kb initial); `strict` forbids `motion.*`.
- `MotionConfig reducedMotion="user"`. Use named transforms (`y`, `scaleX`) — the `transform`
  string is **not** covered by reducedMotion. Scroll-linked values opt out manually.
- Tokens (`motion-tokens.ts`): ease `[0.22, 1, 0.36, 1]`; fast 0.18s, base 0.32s, reveal 0.5s;
  exits ~60% of enters. No overshoot, no infinite loops.
- Above-the-fold entrances are CSS (`animate-rise`, `animate-fade`) so they run before hydration.
- Scroll reveals are CSS too: `<Reveal>` / `.reveal` is a `view()` scroll-driven fade (opacity + 14px)
  over the first 160px of entry, with **no fill**, inside `@supports` and
  `prefers-reduced-motion: no-preference`. Before an element starts entering nothing applies, so
  content is never hidden at rest; print turns entrances off. `delay` becomes a start offset (~40px per 0.1).
- Every animation explains something: place-of-supply toggle (CGST+SGST ⇄ IGST), Draft → Issued
  with the stock deduction, the scroll-drawn document flow, tab and price transitions.

## Components (`frontend/src/features/marketing/components`)

`primitives/` Container, Section (tones), Eyebrow, SectionHeading, ButtonLink/ArrowLink,
Logo, Reveal, StatusPill · `site-header` · `site-footer` · `page-intro` · `product-panels`
(role="img" app screens) · `modules` (single source for tour + /features) · `plan-cards` +
`content/plans.ts` (single source for prices) · `comparison-table` · `faq-list` (Base UI
Accordion) · `contact-form` · `document-layout` + `document-heading` · `cta-band` · `home/testimonials`
(scrolling `TestimonialsColumn` from `components/ui/testimonials-columns-1`, fed by `content/testimonials.ts`).

Testimonials are real customer quotes only, used with permission. Until there are any, the section shows the
invented `sampleTestimonials` in development (labelled "Sample quotes") and renders nothing in production. Its
infinite scroll is the one exception to "no decorative infinite animation": it moves content rather than
decoration, pauses on hover and with a Pause button (WCAG 2.2.2), and stands still under reduced motion.

## Anti-patterns (don't)

- Gradient text, glow blobs, glassmorphism, emoji icons, decorative infinite animation.
- Content that starts at `opacity: 0` and waits for JS or a scroll to appear (e.g. Motion `whileInView`):
  QA found 18 home-page blocks blank in non-scrolling renders before `<Reveal>` moved to CSS.
- Invented social proof (logos, counts, testimonials) or features the product doesn't ship.
- Repeated identical icon-cards; prefer ruled lists and real product content.
- Raw hex in components — use the semantic tokens so the ink tone keeps working.
- `position: absolute` children (e.g. `sr-only`) inside an `overflow-x-auto` scroller that isn't
  `relative` — they widen the page on phones.

## Pre-delivery checklist

- [ ] Text ≥ 4.5:1 on its actual surface (paper, sunken, card, ink)
- [ ] Visible focus on every control; skip link; one h1 per page; sequential headings
- [ ] Reduced motion: no movement, final states shown
- [ ] 375px: no horizontal scroll, no truncated figures; 44px targets
- [ ] Every claim in copy maps to shipped behaviour
- [ ] `pnpm lint --max-warnings 0`, `pnpm tsc --noEmit`, `pnpm build`
