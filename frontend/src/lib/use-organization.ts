import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  addressLine1?: string;
  addressLine2?: string;
  parentOrganizationId?: string;
  isPrimary?: boolean;
  branchCode?: string;
  emailSuffix?: string;
}

export interface OrganizationTree {
  primaryOrganization: Organization;
  branches: Organization[];
}

async function fetchOrganization(): Promise<Organization | null> {
  if (typeof window === "undefined") return null;
  const orgId = localStorage.getItem("active_org_id");
  if (!orgId) return null;
  try {
    const org = await api.get<Organization>(`/organizations/${orgId}`);
    return org;
  } catch {
    return null;
  }
}

export function useOrganization() {
  return useQuery<Organization | null>({
    queryKey: ["active-organization"],
    queryFn: fetchOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useMyOrganizations() {
  return useQuery<Organization[]>({
    queryKey: ["my-organizations"],
    queryFn: async () => {
      try {
        const orgs = await api.get<Organization[]>("/organizations");
        return orgs || [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useOrganizationTree() {
  return useQuery<OrganizationTree[]>({
    queryKey: ["organization-tree"],
    queryFn: async () => {
      try {
        const tree = await api.get<OrganizationTree[]>("/organizations/tree");
        return tree || [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
}

export function switchActiveOrganization(orgId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("active_org_id", orgId);
    window.location.reload();
  }
}

/** Generates up to 2 initials from an org name */
export function getOrgInitials(name?: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Deterministically pick a gradient class from org name */
export function getOrgGradient(name?: string): string {
  const gradients = [
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
    "from-violet-500 to-purple-600",
  ];
  if (!name) return gradients[0];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}
