"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function TaxSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const orgs: any = await apiClient.get(`/organizations`);
      if (orgs && orgs.length > 0) {
        const id = orgs[0].id;
        setOrgId(id);
        const settingsData: any = await apiClient.get(`/organizations/${id}/settings`);
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    
    setSaving(true);
    try {
      await apiClient.put(`/organizations/${orgId}/settings`, settings);
      alert("Tax settings updated successfully!");
    } catch (error) {
      console.error("Failed to update tax settings", error);
      alert("Failed to update tax settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev: any) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  if (loading) return <div className="p-8">Loading settings...</div>;
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
              <Label htmlFor="defaultGstRate">Default GST Rate (%)</Label>
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
              <Label htmlFor="taxInclusivePricing" className="font-normal cursor-pointer">
                Tax Inclusive Pricing by Default
              </Label>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
