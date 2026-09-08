"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Building2, GitBranch, Crown, ArrowRight, ShieldCheck } from "lucide-react";
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
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <HelpTooltip text="Direct image URL for your organization logo to display in the sidebar." />
                </div>
                <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/logo.png" value={org.logoUrl || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
