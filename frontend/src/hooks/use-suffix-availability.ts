"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";

/** Mirrors PublicController.checkSuffix. */
const SUFFIX_PATTERN = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
const FORMAT_ERROR = "Suffix must be 3-30 chars: lowercase letters, numbers, and hyphens only";

export interface SuffixAvailability {
  /** true = free (or already this org's), false = invalid/taken, null = nothing to report yet */
  available: boolean | null;
  error: string | null;
  checking: boolean;
}

/**
 * Live availability of an organization email suffix: format-checked instantly, then checked against the server
 * once typing pauses. Derived from inputs — no effects — so it can never show a stale result for a newer value.
 *
 * @param ownSuffix the organization's current suffix, which counts as available when unchanged
 */
export function useSuffixAvailability(suffix: string | null | undefined, ownSuffix?: string | null): SuffixAvailability {
  const cleaned = (suffix ?? "").trim().toLowerCase();
  const debounced = useDebounce(cleaned, 400);

  const isOwn = !!ownSuffix && cleaned === ownSuffix.trim().toLowerCase();
  const formatOk = SUFFIX_PATTERN.test(cleaned);
  const settled = debounced === cleaned;

  const query = useQuery({
    queryKey: ["suffix-availability", debounced],
    queryFn: () =>
      api.get<{ available: boolean; reason?: string }>(
        `/public/check-suffix?suffix=${encodeURIComponent(debounced)}`
      ),
    enabled: !!cleaned && formatOk && !isOwn && settled,
    staleTime: 30_000,
    retry: false,
  });

  if (!cleaned) return { available: null, error: null, checking: false };
  if (!formatOk) return { available: false, error: FORMAT_ERROR, checking: false };
  if (isOwn) return { available: true, error: null, checking: false };
  if (!settled || query.isFetching) return { available: null, error: null, checking: true };
  if (query.isError) return { available: false, error: "Unable to verify suffix availability", checking: false };
  if (query.data?.available) return { available: true, error: null, checking: false };
  if (query.data) {
    return { available: false, error: query.data.reason || "This suffix is already in use", checking: false };
  }
  return { available: null, error: null, checking: false };
}
