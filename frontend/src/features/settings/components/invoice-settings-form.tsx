"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function InvoiceSettingsForm() {
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

  const { data: invoiceSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["invoiceSettings", orgId],
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
    if (invoiceSettings) {
      setSettings(invoiceSettings);
    }
  }, [invoiceSettings]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceSettings", orgId] });
      alert("Invoice settings updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update invoice settings", error);
      alert("Failed to update invoice settings.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;
    updateMutation.mutate(settings);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  if (loadingOrgs || (orgId && loadingSettings)) return <div className="p-8">Loading settings...</div>;
  if (!settings) return <div className="p-8">Settings not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoice Settings</h2>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Configuration</CardTitle>
            <CardDescription>Configure numbering, terms, and bank details for your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input 
                  id="invoicePrefix" 
                  name="invoicePrefix" 
                  placeholder="e.g. INV"
                  value={settings.invoicePrefix || ""} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumberFormat">Number Format</Label>
                <Input 
                  id="invoiceNumberFormat" 
                  name="invoiceNumberFormat" 
                  placeholder="{PREFIX}/{FY}/{SEQUENCE}"
                  value={settings.invoiceNumberFormat || ""} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank Details</Label>
              <Textarea 
                id="bankDetails" 
                name="bankDetails" 
                rows={4}
                placeholder="Bank Name: HDFC&#10;Account No: 123456789&#10;IFSC: HDFC0001234"
                value={settings.bankDetails || ""} 
                onChange={handleChange} 
              />
              <p className="text-sm text-muted-foreground">These details will be printed at the bottom of your invoices.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceTerms">Terms & Conditions</Label>
              <Textarea 
                id="invoiceTerms" 
                name="invoiceTerms" 
                rows={4}
                placeholder="1. Goods once sold will not be taken back.&#10;2. Interest @ 18% p.a. will be charged if payment is delayed."
                value={settings.invoiceTerms || ""} 
                onChange={handleChange} 
              />
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
