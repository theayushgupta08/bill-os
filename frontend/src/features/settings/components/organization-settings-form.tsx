"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Building2 } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/tooltip";
import { Organization } from "@/types";

export function OrganizationSettingsForm() {
  const queryClient = useQueryClient();
  const [org, setOrg] = useState<Organization | null>(null);

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<Organization[]>(`/organizations`);
      return res;
    }
  });

  useEffect(() => {
    if (orgData && orgData.length > 0) {
      const fetchedOrg = { ...orgData[0] };
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
    </div>
  );
}
