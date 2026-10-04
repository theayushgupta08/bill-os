/** Motion tokens shared by marketing components. Mirrors `--ease-ledger` in globals.css. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  /** Hover, press, toggles */
  fast: 0.18,
  /** Panels, tab content, menus */
  base: 0.32,
  /** Scroll reveals */
  reveal: 0.5,
  /** Number count-ups */
  count: 0.9,
} as const;

/** Distance (px) content travels while revealing. Small on purpose: it should feel settled, not flown in. */
export const REVEAL_OFFSET = 14;
