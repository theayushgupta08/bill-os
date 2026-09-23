"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useOrganization } from "@/lib/use-organization";
import {
  DEFAULT_FORMAT_PREFERENCES,
  formatDate,
  formatDateTime,
  formatLongDate,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  toFormatPreferences,
  type FormatPreferences,
  type StoredPreferences,
} from "@/lib/format";

/** Query key for the active organization's settings; invalidate it after saving any settings. */
export const ORGANIZATION_SETTINGS_KEY = "organization-settings";

export interface Formatter {
  prefs: FormatPreferences;
  formatMoney: (value: number | string | null | undefined) => string;
  formatMoneyCompact: (value: number | string | null | undefined) => string;
  formatNumber: (value: number | string | null | undefined) => string;
  formatDate: (value: string | Date | null | undefined) => string;
  formatDateTime: (value: string | Date | null | undefined) => string;
  formatLongDate: (value: Date) => string;
}

function makeFormatter(prefs: FormatPreferences): Formatter {
  return {
    prefs,
    formatMoney: (v) => formatMoney(v, prefs),
    formatMoneyCompact: (v) => formatMoneyCompact(v, prefs),
    formatNumber: (v) => formatNumber(v, prefs),
    formatDate: (v) => formatDate(v, prefs),
    formatDateTime: (v) => formatDateTime(v, prefs),
    formatLongDate: (v) => formatLongDate(v, prefs),
  };
}

const FormatContext = createContext<Formatter>(makeFormatter(DEFAULT_FORMAT_PREFERENCES));

/** Loads the active organization's preferences and exposes formatters bound to them. */
export function FormatPreferencesProvider({ children }: { children: ReactNode }) {
  const { data: org } = useOrganization();
  const { data: settings } = useQuery({
    queryKey: [ORGANIZATION_SETTINGS_KEY, org?.id],
    queryFn: () => api.get<StoredPreferences>(`/organizations/${org?.id}/settings`),
    enabled: !!org?.id,
  });

  const formatter = useMemo(() => makeFormatter(toFormatPreferences(settings)), [settings]);
  return <FormatContext.Provider value={formatter}>{children}</FormatContext.Provider>;
}

/** Money/date formatters that follow Settings → Preferences (defaults: en-IN, Asia/Kolkata, DD/MM/YYYY). */
export function useFormat(): Formatter {
  return useContext(FormatContext);
}
