"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

export const CURRENT_USER_KEY = ["current-user"] as const;

export interface CurrentUser {
  name: string;
  email: string;
  avatarUrl: string | null;
}

type Metadata = Record<string, unknown>;

function text(meta: Metadata, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fullName(meta: Metadata, first: string, last: string): string | null {
  const given = text(meta, first);
  return given ? `${given} ${text(meta, last) ?? ""}`.trim() : null;
}

/** Name from OAuth (Google) or signup metadata, falling back to the email's local part. */
function nameFromMetadata(meta: Metadata, identity: Metadata, email: string): string {
  const resolved =
    text(meta, "full_name") ??
    text(meta, "name") ??
    fullName(meta, "first_name", "last_name") ??
    fullName(meta, "given_name", "family_name") ??
    text(identity, "full_name") ??
    text(identity, "name") ??
    fullName(identity, "given_name", "family_name");
  if (resolved) return resolved;
  const prefix = email.split("@")[0] ?? "";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const meta = (session.user.user_metadata ?? {}) as Metadata;
  const identity = (session.user.identities?.[0]?.identity_data ?? {}) as Metadata;
  const email = session.user.email ?? "";
  let name = nameFromMetadata(meta, identity, email);

  // The billOS profile (editable in "Update profile") wins over identity-provider metadata
  try {
    const profile = await api.get<{ firstName?: string; lastName?: string }>("/users/me");
    if (profile?.firstName) name = `${profile.firstName} ${profile.lastName ?? ""}`.trim();
  } catch {
    // Keep the metadata name if the profile can't be loaded (e.g. onboarding not finished)
  }

  const avatarUrl =
    text(meta, "avatar_url") ?? text(meta, "picture") ?? text(identity, "avatar_url") ?? text(identity, "picture");
  return { name, email, avatarUrl };
}

/** The signed-in user's display details, or null when signed out. */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
