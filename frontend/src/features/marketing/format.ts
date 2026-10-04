// The marketing site has no signed-in user and therefore no Settings → Preferences, so the
// dashboard's useFormat() doesn't apply. Sample figures always use the Indian number system.
const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 25488 → "25,488.00" */
export function formatAmount(value: number): string {
  return inr.format(value);
}

/** 1842600 → "₹18,42,600" */
export function formatRupees(value: number): string {
  return `₹${inrWhole.format(value)}`;
}
