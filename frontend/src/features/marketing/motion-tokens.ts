/** Motion tokens shared by marketing components. Mirrors `--ease-ledger` in globals.css. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  /** Hover, press, toggles */
  fast: 0.18,
  /** Panels, tab content, menus */
  base: 0.32,
} as const;

// Scroll reveals are CSS, not Motion: see `.reveal` in globals.css and primitives/reveal.tsx.
