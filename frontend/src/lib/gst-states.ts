/**
 * GST state codes, used to preview whether a supply is intra-state (CGST + SGST) or inter-state (IGST). Mirrors the
 * backend's `GstStates`, which makes the real decision when the document is saved — keep the two in step.
 *
 * States are free text on customers and suppliers, so "Maharashtra", "maharashtra ", "MH", "27" and "27-Maharashtra"
 * all resolve to the same code.
 */

const STATES: [code: string, ...names: string[]][] = [
  ["01", "Jammu and Kashmir", "JK"],
  ["02", "Himachal Pradesh", "HP"],
  ["03", "Punjab", "PB"],
  ["04", "Chandigarh", "CH"],
  ["05", "Uttarakhand", "UK", "UT", "Uttaranchal"],
  ["06", "Haryana", "HR"],
  ["07", "Delhi", "DL", "New Delhi", "NCT of Delhi"],
  ["08", "Rajasthan", "RJ"],
  ["09", "Uttar Pradesh", "UP"],
  ["10", "Bihar", "BR"],
  ["11", "Sikkim", "SK"],
  ["12", "Arunachal Pradesh", "AR"],
  ["13", "Nagaland", "NL"],
  ["14", "Manipur", "MN"],
  ["15", "Mizoram", "MZ"],
  ["16", "Tripura", "TR"],
  ["17", "Meghalaya", "ML"],
  ["18", "Assam", "AS"],
  ["19", "West Bengal", "WB"],
  ["20", "Jharkhand", "JH"],
  ["21", "Odisha", "OD", "OR", "Orissa"],
  ["22", "Chhattisgarh", "CG", "CT", "Chattisgarh"],
  ["23", "Madhya Pradesh", "MP"],
  ["24", "Gujarat", "GJ"],
  // Daman and Diu (code 25) merged into code 26 in 2020
  ["26", "Dadra and Nagar Haveli and Daman and Diu", "DN", "DD", "Daman and Diu", "Dadra and Nagar Haveli"],
  ["27", "Maharashtra", "MH"],
  ["29", "Karnataka", "KA"],
  ["30", "Goa", "GA"],
  ["31", "Lakshadweep", "LD"],
  ["32", "Kerala", "KL"],
  ["33", "Tamil Nadu", "TN"],
  ["34", "Puducherry", "PY", "Pondicherry"],
  ["35", "Andaman and Nicobar Islands", "AN", "Andaman and Nicobar"],
  ["36", "Telangana", "TS", "TG"],
  ["37", "Andhra Pradesh", "AP"],
  ["38", "Ladakh", "LA"],
  ["97", "Other Territory", "OT"],
];

/** Lower-case letters, digits and single spaces; "&" reads as "and". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CODE_BY_NAME = new Map<string, string>();
for (const [code, ...names] of STATES) {
  for (const name of names) CODE_BY_NAME.set(normalize(name), code);
}
const CODES = new Set(STATES.map(([code]) => code));

/** The two-digit GST state code for a state name, abbreviation or code ("Maharashtra", "MH", "27"). */
export function stateCode(state?: string | null): string | null {
  if (!state || !state.trim()) return null;
  const key = normalize(state);
  if (/^\d{1,2}$/.test(key)) {
    const code = key.padStart(2, "0");
    return CODES.has(code) ? code : null;
  }
  return (
    CODE_BY_NAME.get(key) ??
    CODE_BY_NAME.get(key.replace(/\d/g, " ").replace(/\s+/g, " ").trim()) ??
    null
  );
}

/** The state code a GSTIN was issued in: its first two digits. */
export function gstinStateCode(gstin?: string | null): string | null {
  const prefix = gstin?.trim().slice(0, 2) ?? "";
  return /^\d{2}$/.test(prefix) ? stateCode(prefix) : null;
}

interface Party {
  state?: string | null;
  gstin?: string | null;
}

/**
 * Whether a supply between the organization and a counterparty crosses a state border (IGST). Each side's state
 * comes from its state field, or else its GSTIN; when either can't be resolved the normalized text is compared, and
 * when either is unknown the supply is treated as intra-state — the same rules the backend applies.
 */
export function isInterState(org: Party, party: Party): boolean {
  const orgCode = stateCode(org.state) ?? gstinStateCode(org.gstin);
  const partyCode = stateCode(party.state) ?? gstinStateCode(party.gstin);
  if (orgCode && partyCode) return orgCode !== partyCode;
  if (!org.state?.trim() || !party.state?.trim()) return false;
  return normalize(org.state) !== normalize(party.state);
}
