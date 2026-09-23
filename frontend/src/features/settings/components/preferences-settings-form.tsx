"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useOrganization } from "@/lib/use-organization";
import { ORGANIZATION_SETTINGS_KEY } from "@/lib/use-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/tooltip";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
import { PreferencesSettings } from "@/types";

export function PreferencesSettingsForm() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PreferencesSettings | null>(null);

  // Settings belong to the active organization (branch-aware), not simply the first one the user can see
  const { data: activeOrg, isLoading: loadingOrgs } = useOrganization();
  const orgId = activeOrg?.id ?? null;

  const { data: prefSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["prefSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<PreferencesSettings>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  // Copy freshly fetched data into the editable form state (render-time sync instead of an effect)
  const [syncedPrefSettings, setSyncedPrefSettings] = useState<typeof prefSettings>(undefined);
  if (prefSettings && prefSettings !== syncedPrefSettings) {
    setSyncedPrefSettings(prefSettings);
    setSettings(prefSettings);
  }

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<PreferencesSettings>) => api.put<PreferencesSettings>(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prefSettings", orgId] });
      // Re-bind the app-wide formatters (useFormat) to the new preferences immediately
      queryClient.invalidateQueries({ queryKey: [ORGANIZATION_SETTINGS_KEY, orgId] });
      toast.success("Preferences updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;
    updateMutation.mutate(settings);
  };

  const handleSelectChange = (name: keyof PreferencesSettings, value: string) => {
    setSettings((prev: PreferencesSettings | null) => prev ? ({ ...prev, [name]: value }) : prev);
  };

  if (loadingOrgs || (orgId && loadingSettings)) {
    return <BrandLoader size="lg" text="Loading preferences..." variant="card" showBrandText />;
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-800/80 rounded-xl bg-slate-900/40">
        Preferences not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Preferences
            <PageHelpTooltip
              title="System & UI Preferences"
              description="Choose how amounts, dates and times are displayed throughout billOS for this organization."
            />
          </h2>
          <p className="text-sm text-slate-400">Customize how BillOS looks and formats data for your organization.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">User & System Preferences</CardTitle>
            <CardDescription className="text-xs text-slate-400">Customize how BillOS looks and formats data for your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="language">Number Format</Label>
                <HelpTooltip text="How amounts and quantities are grouped on screen. Interface text is in English." />
              </div>
              <Select 
                value={settings.language === "en-US" ? "en-US" : "en-IN"} 
                onValueChange={(val: string | null) => val && handleSelectChange("language", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a number format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">Indian — ₹1,00,000.00</SelectItem>
                  <SelectItem value="en-US">International — ₹100,000.00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="timezone">Timezone</Label>
                <HelpTooltip text="Time zone used to show times on activity, audit logs and notifications. Document dates (invoice, bill, order dates) are calendar dates and are never shifted." />
              </div>
              <Select 
                value={settings.timezone || "Asia/Kolkata"} 
                onValueChange={(val: string | null) => val && handleSelectChange("timezone", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">EST (America/New_York)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="dateFormat">Date Format</Label>
                <HelpTooltip text="Select how dates should be formatted in all tables, invoices, and reports." />
              </div>
              <Select 
                value={settings.dateFormat || "DD/MM/YYYY"} 
                onValueChange={(val: string | null) => val && handleSelectChange("dateFormat", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2026)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2026)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-25)</SelectItem>
                </SelectContent>
              </Select>
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
