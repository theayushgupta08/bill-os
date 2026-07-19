"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";

function Tooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1.5 align-middle cursor-help">
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-950 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 font-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
      </div>
    </div>
  );
}

export function OrganizationSettingsForm() {
  const queryClient = useQueryClient();
  const [org, setOrg] = useState<any>(null);

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<any>(`/organizations`);
      return res;
    }
  });

  useEffect(() => {
    if (orgData && orgData.length > 0) {
      setOrg(orgData[0]);
    }
  }, [orgData]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/organizations/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      alert("Organization details updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update organization", error);
      alert("Failed to update organization details.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id) return;
    updateMutation.mutate(org);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrg((prev: any) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;
  if (!org) return <div className="p-8">Organization not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Update your company details and GST information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="name">Display Name</Label>
                  <Tooltip text="The common name for your business as displayed across the billOS application." />
                </div>
                <Input id="name" name="name" value={org.name || ""} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="legalName">Legal Entity Name</Label>
                  <Tooltip text="The official registered name of your company (e.g. Acme Corporation Private Limited)." />
                </div>
                <Input id="legalName" name="legalName" value={org.legalName || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Tooltip text="The Goods and Services Tax Identification Number of your organization." />
                </div>
                <Input id="gstin" name="gstin" value={org.gstin || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="email">Email</Label>
                  <Tooltip text="The official primary contact email address for your organization." />
                </div>
                <Input id="email" name="email" type="email" value={org.email || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="phone">Phone</Label>
                  <Tooltip text="The official primary contact telephone or mobile number for your organization." />
                </div>
                <Input id="phone" name="phone" value={org.phone || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Tooltip text="The first line of your organization's physical address (street name, building number)." />
              </div>
              <Input id="addressLine1" name="addressLine1" value={org.addressLine1 || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Tooltip text="The second line of your organization's physical address (suite, unit, floor, locality)." />
              </div>
              <Input id="addressLine2" name="addressLine2" value={org.addressLine2 || ""} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="city">City</Label>
                  <Tooltip text="The city where your organization's office is located." />
                </div>
                <Input id="city" name="city" value={org.city || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="state">State</Label>
                  <Tooltip text="The state or province where your organization's office is located." />
                </div>
                <Input id="state" name="state" value={org.state || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Tooltip text="The postal code or zip code for your organization's location." />
                </div>
                <Input id="pincode" name="pincode" value={org.pincode || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
