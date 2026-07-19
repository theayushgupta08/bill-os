"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export function TaxSettingsForm() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<any>(`/organizations`);
      return res;
    }
  });

  const { data: taxSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["taxSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<any>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      setOrgId(orgs[0].id);
    }
  }, [orgs]);

  useEffect(() => {
    if (taxSettings) {
      setSettings(taxSettings);
    }
  }, [taxSettings]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings", orgId] });
      alert("Tax settings updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update tax settings", error);
      alert("Failed to update tax settings.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;
    updateMutation.mutate(settings);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev: any) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  if (loadingOrgs || (orgId && loadingSettings)) return <div className="p-8">Loading settings...</div>;
  if (!settings) return <div className="p-8">Settings not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-2xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tax Settings</h2>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>GST Configuration</CardTitle>
            <CardDescription>Configure default tax rates and behaviors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="defaultGstRate">Default GST Rate (%)</Label>
                <Tooltip text="The default percentage rate applied to items on invoices if no specific rate is configured." />
              </div>
              <Input 
                id="defaultGstRate" 
                name="defaultGstRate" 
                type="number"
                step="0.01"
                value={settings.defaultGstRate || ""} 
                onChange={handleChange} 
              />
              <p className="text-sm text-muted-foreground">This rate will be pre-filled when creating new products.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="taxInclusivePricing" 
                name="taxInclusivePricing"
                checked={settings.taxInclusivePricing || false}
                onCheckedChange={(checked) => setSettings((p:any) => ({...p, taxInclusivePricing: checked}))}
              />
              <div className="flex items-center">
                <Label htmlFor="taxInclusivePricing" className="font-normal cursor-pointer">
                  Tax Inclusive Pricing by Default
                </Label>
                <Tooltip text="When checked, entered prices on sales/purchases include the tax amount by default." />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
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
