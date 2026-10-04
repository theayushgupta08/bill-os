/**
 * Display formatting driven by the organization's preferences (Settings → Preferences).
 * Components should use the `useFormat()` hook, which binds these to the active organization's settings;
 * the pure functions here take the preferences explicitly so they are easy to test and reuse.
 */

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface FormatPreferences {
  /** BCP-47 locale used for number grouping, e.g. en-IN → 1,00,000.00 and en-US → 100,000.00 */
  locale: string;
  /** IANA time zone used to show timestamps (created/updated times, notifications) */
  timeZone: string;
  dateFormat: DateFormat;
  /** Amounts are GST rupee amounts throughout billOS */
  currency: string;
}

/** Shape of the stored preference fields in OrganizationSettings (`language` holds the regional format). */
export interface StoredPreferences {
  language?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
}

export const DEFAULT_FORMAT_PREFERENCES: FormatPreferences = {
  locale: "en-IN",
  timeZone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  currency: "INR",
};

/**
 * Stored `language` values → formatting locale. The UI has no translations, so this setting only controls the
 * regional number format. Legacy values ("en" is the column default, "hi") keep the Indian grouping the app has
 * always shown.
 */
const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: "en-IN",
  "en-IN": "en-IN",
  hi: "en-IN",
  "en-US": "en-US",
};

const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function toFormatPreferences(stored?: StoredPreferences | null): FormatPreferences {
  const locale = (stored?.language && LOCALE_BY_LANGUAGE[stored.language]) || DEFAULT_FORMAT_PREFERENCES.locale;
  const timeZone =
    stored?.timezone && isValidTimeZone(stored.timezone) ? stored.timezone : DEFAULT_FORMAT_PREFERENCES.timeZone;
  const dateFormat = DATE_FORMATS.includes(stored?.dateFormat as DateFormat)
    ? (stored?.dateFormat as DateFormat)
    : DEFAULT_FORMAT_PREFERENCES.dateFormat;
  return { ...DEFAULT_FORMAT_PREFERENCES, locale, timeZone, dateFormat };
}

type NumericInput = number | string | null | undefined;

function toNumber(value: NumericInput): number {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(n) ? (n as number) : 0;
}

/** ₹1,00,000.00 (en-IN) / ₹100,000.00 (en-US) — always two decimals. */
export function formatMoney(value: NumericInput, prefs: FormatPreferences): string {
  return new Intl.NumberFormat(prefs.locale, {
    style: "currency",
    currency: prefs.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

/** Short amounts for KPI tiles: ₹1.5L / ₹2.3Cr in Indian locales, ₹150K / ₹23M otherwise. */
export function formatMoneyCompact(value: NumericInput, prefs: FormatPreferences): string {
  return new Intl.NumberFormat(prefs.locale, {
    style: "currency",
    currency: prefs.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

export function formatNumber(value: NumericInput, prefs: FormatPreferences): string {
  return new Intl.NumberFormat(prefs.locale, { maximumFractionDigits: 3 }).format(toNumber(value));
}

interface DateParts {
  year: string;
  month: string;
  day: string;
}

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Calendar dates from the API ("2026-09-23", Java LocalDate) are taken as-is — converting them through a time
 * zone could shift the day. Timestamps are converted to the organization's time zone first.
 */
function dateParts(value: string | Date, timeZone: string): DateParts | null {
  if (typeof value === "string") {
    const m = CALENDAR_DATE.exec(value);
    if (m) return { year: m[1], month: m[2], day: m[3] };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

function assemble({ year, month, day }: DateParts, format: DateFormat): string {
  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDate(value: string | Date | null | undefined, prefs: FormatPreferences): string {
  if (!value) return "—";
  const parts = dateParts(value, prefs.timeZone);
  return parts ? assemble(parts, prefs.dateFormat) : String(value);
}

/** Date in the chosen format plus the time of day, both in the organization's time zone. */
export function formatDateTime(value: string | Date | null | undefined, prefs: FormatPreferences): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const time = new Intl.DateTimeFormat(prefs.locale, {
    timeZone: prefs.timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatDate(date, prefs)}, ${time}`;
}

/**
 * Today's calendar date ("2026-10-04") in the organization's time zone — the default for date inputs.
 * `new Date().toISOString()` gives the UTC date, which in India is still yesterday until 05:30.
 */
export function todayIn(timeZone: string): string {
  const parts = dateParts(new Date(), timeZone);
  return parts ? assemble(parts, "YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
}

/** A calendar date ("2026-10-04") moved by whole days, without any time-zone shift. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Long, human date for headings, e.g. "Wednesday, 23 September 2026" in the org's locale and time zone. */
export function formatLongDate(value: Date, prefs: FormatPreferences): string {
  return new Intl.DateTimeFormat(prefs.locale, {
    timeZone: prefs.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}
