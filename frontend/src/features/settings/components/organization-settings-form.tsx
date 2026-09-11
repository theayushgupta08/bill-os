"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Building2, GitBranch, Crown, ArrowRight, ShieldCheck, Upload, Trash2, Check, AlertCircle, Loader2 } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/tooltip";
import { Organization } from "@/types";
import { useOrganizationTree, switchActiveOrganization } from "@/lib/use-organization";
import { CreateBranchDialog } from "@/components/organization/create-branch-dialog";

export function OrganizationSettingsForm() {
  const queryClient = useQueryClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const { data: orgTree } = useOrganizationTree();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Email Suffix validation state
  const [suffixChecking, setSuffixChecking] = useState(false);
  const [suffixAvailable, setSuffixAvailable] = useState<boolean | null>(null);
  const [suffixError, setSuffixError] = useState<string | null>(null);

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<Organization[]>(`/organizations`);
      return res;
    }
  });

  useEffect(() => {
    if (orgData && orgData.length > 0) {
      const activeOrgId = typeof window !== "undefined" ? localStorage.getItem("active_org_id") : null;
      const matched = orgData.find((o) => o.id === activeOrgId) || orgData[0];
      const fetchedOrg = { ...matched };
      if (!fetchedOrg.secondaryPhones) {
        fetchedOrg.secondaryPhones = [];
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrg(fetchedOrg);
    }
  }, [orgData]);

  // Debounced check for email suffix uniqueness when edited
  useEffect(() => {
    if (!org?.emailSuffix) {
      setSuffixAvailable(null);
      setSuffixError(null);
      setSuffixChecking(false);
      return;
    }

    const currentSaved = orgData?.find((o) => o.id === org.id)?.emailSuffix;
    const cleaned = org.emailSuffix.trim().toLowerCase();

    // If unchanged from currently saved in DB, it's already theirs
    if (cleaned === currentSaved) {
      setSuffixAvailable(true);
      setSuffixError(null);
      setSuffixChecking(false);
      return;
    }

    const regex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
    if (cleaned.length < 3 || cleaned.length > 30 || !regex.test(cleaned)) {
      setSuffixAvailable(false);
      setSuffixError("Suffix must be 3-30 chars: lowercase letters, numbers, and hyphens only");
      setSuffixChecking(false);
      return;
    }

    setSuffixChecking(true);
    setSuffixError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason?: string }>(
          `/public/check-suffix?suffix=${encodeURIComponent(cleaned)}`
        );
        if (res.available) {
          setSuffixAvailable(true);
          setSuffixError(null);
        } else {
          setSuffixAvailable(false);
          setSuffixError(res.reason || "This suffix is already taken by another organization");
        }
      } catch {
        setSuffixAvailable(false);
        setSuffixError("Unable to verify suffix availability");
      } finally {
        setSuffixChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [org?.emailSuffix, org?.id, orgData]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Organization>) => api.put<Organization>(`/organizations/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["active-organization"] });
      toast.success("Organization details updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update organization", error);
      toast.error("Failed to update organization details.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id) return;
    if (suffixAvailable === false) {
      toast.error(suffixError || "Please provide a valid, available email suffix.");
      return;
    }
    updateMutation.mutate(org);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrg((prev: Organization | null) => prev ? ({ ...prev, [name]: value }) : prev);
  };

  const handleSecondaryPhoneChange = (index: number, value: string) => {
    setOrg((prev: Organization | null) => {
      if (!prev) return prev;
      const updated = [...(prev.secondaryPhones || [])];
      updated[index] = value;
      return { ...prev, secondaryPhones: updated };
    });
  };

  const addSecondaryPhone = () => {
    setOrg((prev: Organization | null) => {
      if (!prev) return prev;
      const current = prev.secondaryPhones || [];
      if (current.length < 5) {
        return { ...prev, secondaryPhones: [...current, ""] };
      }
      return prev;
    });
  };

  const removeSecondaryPhone = (index: number) => {
    setOrg((prev: Organization | null) => {
      if (!prev) return prev;
      const updated = (prev.secondaryPhones || []).filter((_, i: number) => i !== index);
      return { ...prev, secondaryPhones: updated };
    });
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo image size must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOrg((prev: Organization | null) => (prev ? { ...prev, logoUrl: result } : prev));
      toast.info("Logo selected. Click 'Save Changes' to apply.");
    };
    reader.readAsDataURL(file);

    // Reset input so selecting the same file triggers change
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setOrg((prev: Organization | null) => (prev ? { ...prev, logoUrl: "" } : prev));
    toast.info("Logo removed. Click 'Save Changes' to apply.");
  };

  if (isLoading) {
    return <BrandLoader size="lg" text="Loading organization details..." variant="card" showBrandText />;
  }

  if (!org) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-800/80 rounded-xl bg-slate-900/40">
        Organization not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Organization Profile</h2>
          <p className="text-sm text-slate-400">Update your company details, registered addresses, and GST information.</p>
        </div>
      </div>

      {/* Corporate Hierarchy & Branches Card */}
      <Card className="border border-indigo-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-sm shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  Corporate Hierarchy & Branches
                  {org.isPrimary || !org.parentOrganizationId ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      👑 Primary Organization
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      🏢 Subsidiary Branch
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Manage official branches, shared master pricing, customer accounts, and QR routing.
                </CardDescription>
              </div>
            </div>

            {(org.isPrimary || !org.parentOrganizationId) && (
              <Button
                type="button"
                onClick={() => setCreateBranchOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 shadow-sm font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Branch
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Active Sharing Policies Badge Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Fixed Master Price</p>
                <p className="text-[11px] text-slate-400 leading-tight">Master prices govern all branches without price drift.</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Consolidated Ledger</p>
                <p className="text-[11px] text-slate-400 leading-tight">Shared customers with multi-branch ledger breakdown.</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Centralized QR Books</p>
                <p className="text-[11px] text-slate-400 leading-tight">Collections route into Primary books with branch tags.</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Unified Team Access</p>
                <p className="text-[11px] text-slate-400 leading-tight">Permissions inherited automatically across branches.</p>
              </div>
            </div>
          </div>

          {/* If Branch: Show Parent Link */}
          {org.parentOrganizationId && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Parent Organization:{" "}
                    {orgTree?.find((t) => t.primaryOrganization.id === org.parentOrganizationId)?.primaryOrganization.name || "Headquarters"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This branch operates under the central governance of your Primary Organization.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => org.parentOrganizationId && switchActiveOrganization(org.parentOrganizationId)}
                className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs h-7"
              >
                Switch to Primary <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}

          {/* If Primary: List Connected Branches */}
          {(org.isPrimary || !org.parentOrganizationId) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
                <span>CONNECTED BRANCHES & SUBSIDIARIES</span>
                <span>
                  {orgTree?.find((t) => t.primaryOrganization.id === org.id)?.branches?.length || 0} registered
                </span>
              </div>

              {(() => {
                const currentTree = orgTree?.find((t) => t.primaryOrganization.id === org.id);
                const branches = currentTree?.branches || [];

                if (branches.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
                      <GitBranch className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-slate-400">No secondary branches created yet.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Add regional retail stores, depots, or secondary offices to share products, customers, and QRs.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setCreateBranchOpen(true)}
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        + Create First Branch
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {branches.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-white truncate">{b.name}</span>
                            {b.branchCode && (
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
                                {b.branchCode}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {b.city || b.state ? `${b.city || ""}, ${b.state || ""}` : b.gstin || "Connected Branch"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => switchActiveOrganization(b.id)}
                          className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 flex-shrink-0"
                        >
                          Switch <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSave}>
        <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Company Profile</CardTitle>
            <CardDescription className="text-xs text-slate-400">Update your company details and GST information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Organization Logo Section */}
            <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
              <div className="flex items-center">
                <Label>Organization Logo</Label>
                <HelpTooltip text="Brand logo displayed in the application sidebar, header, and official invoice documents." />
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-900/90 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name || "Organization Logo"}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Building2 className="w-6 h-6 mb-0.5 text-slate-400" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">No Logo</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="h-8 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Update Logo
                    </Button>
                    {org.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: Square PNG, JPG, or SVG under 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="name">Display Name</Label>
                  <HelpTooltip text="The common name for your business as displayed across the billOS application." />
                </div>
                <Input id="name" name="name" value={org.name || ""} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="legalName">Legal Entity Name</Label>
                  <HelpTooltip text="The official registered name of your company (e.g. Acme Corporation Private Limited)." />
                </div>
                <Input id="legalName" name="legalName" value={org.legalName || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <HelpTooltip text="The Goods and Services Tax Identification Number of your organization." />
                </div>
                <Input id="gstin" name="gstin" value={org.gstin || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="email">Email</Label>
                  <HelpTooltip text="The official primary contact email address for your organization." />
                </div>
                <Input id="email" name="email" type="email" value={org.email || ""} onChange={handleChange} />
              </div>
            </div>

            {/* Team Email Suffix Section */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label htmlFor="emailSuffix" className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Team Email Suffix
                  </Label>
                  <HelpTooltip text="Unique domain suffix for staff login accounts (e.g. firstname.lastname.XX@suffix.billos.app). Branches automatically inherit this suffix." />
                </div>
                {org.parentOrganizationId && !org.isPrimary ? (
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Inherited from Primary Organization
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    @{org.emailSuffix || "suffix"}.billos.app
                  </span>
                )}
              </div>

              {org.parentOrganizationId && !org.isPrimary ? (
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-400 font-mono">
                  <span>
                    {orgTree?.find((t) => t.primaryOrganization.id === org.parentOrganizationId)?.primaryOrganization.emailSuffix || org.emailSuffix || "hq"}
                  </span>
                  <span className="text-slate-500 ml-1">.billos.app</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 focus-within:border-indigo-500 overflow-hidden">
                    <Input
                      id="emailSuffix"
                      name="emailSuffix"
                      value={org.emailSuffix || ""}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setOrg((prev) => (prev ? { ...prev, emailSuffix: val } : prev));
                      }}
                      placeholder="e.g. myshop"
                      maxLength={30}
                      className="border-0 bg-transparent text-white font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                    />
                    <span className="px-3 text-slate-400 font-mono text-xs bg-slate-800/80 h-10 flex items-center border-l border-slate-800 select-none">
                      .billos.app
                    </span>
                  </div>

                  {suffixChecking && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      Checking availability...
                    </p>
                  )}
                  {!suffixChecking && suffixAvailable === true && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Available! Staff login email format:
                      </p>
                      <p className="text-[11px] font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                        firstname.lastname.XX@{org.emailSuffix?.trim().toLowerCase()}.billos.app
                      </p>
                    </div>
                  )}
                  {!suffixChecking && suffixAvailable === false && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {suffixError || "This suffix is not available. Please choose another."}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="website">Website URL</Label>
                  <HelpTooltip text="The official website for your organization (clicking the sidebar logo will open this URL)." />
                </div>
                <Input id="website" name="website" placeholder="https://yourcompany.com" value={org.website || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="phone">Primary Phone</Label>
                  <HelpTooltip text="The official primary contact telephone or mobile number for your organization." />
                </div>
                <Input 
                  id="phone" 
                  name="phone" 
                  required 
                  pattern="^\+\d{1,4} \d{4,14}$"
                  title="Format: Country Code + Phone (e.g. +91 9876543210)"
                  placeholder="+91 9876543210"
                  value={org.phone || ""} 
                  onChange={handleChange} 
                />
              </div>
            </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Secondary Phones</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addSecondaryPhone}
                    disabled={(org.secondaryPhones || []).length >= 5}
                    className="h-6 px-2 text-indigo-400 hover:text-indigo-300 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(org.secondaryPhones || []).map((sp: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="tel"
                        required
                        pattern="^\+\d{1,4} \d{4,14}$"
                        title="Format: Country Code + Phone (e.g. +91 9876543210)"
                        placeholder="+91 9876543210"
                        value={sp}
                        onChange={(e) => handleSecondaryPhoneChange(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSecondaryPhone(index)}
                        className="h-10 w-10 text-slate-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <HelpTooltip text="The first line of your organization's physical address (street name, building number)." />
              </div>
              <Input id="addressLine1" name="addressLine1" value={org.addressLine1 || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <HelpTooltip text="The second line of your organization's physical address (suite, unit, floor, locality)." />
              </div>
              <Input id="addressLine2" name="addressLine2" value={org.addressLine2 || ""} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="city">City</Label>
                  <HelpTooltip text="The city where your organization's office is located." />
                </div>
                <Input id="city" name="city" value={org.city || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="state">State</Label>
                  <HelpTooltip text="The state or province where your organization's office is located." />
                </div>
                <Input id="state" name="state" value={org.state || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="pincode">Pincode</Label>
                  <HelpTooltip text="The postal code or zip code for your organization's location." />
                </div>
                <Input id="pincode" name="pincode" value={org.pincode || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/80">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {org && (
        <CreateBranchDialog
          open={createBranchOpen}
          onOpenChange={setCreateBranchOpen}
          parentOrg={
            (orgTree?.find((t) => t.primaryOrganization.id === org.id || t.primaryOrganization.id === org.parentOrganizationId)?.primaryOrganization as any) || org
          }
        />
      )}
    </div>
  );
}
