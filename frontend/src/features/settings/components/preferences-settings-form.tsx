"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
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
import { PreferencesSettings, Organization } from "@/types";

export function PreferencesSettingsForm() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PreferencesSettings | null>(null);

  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<Organization[]>(`/organizations`);
      return res;
    }
  });

  const { data: prefSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["prefSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<PreferencesSettings>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      // eslint-disable-next-line
      setOrgId(orgs[0].id);
    }
  }, [orgs]);

  useEffect(() => {
    if (prefSettings) {
      // eslint-disable-next-line
      setSettings(prefSettings);
    }
  }, [prefSettings]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<PreferencesSettings>) => api.put<PreferencesSettings>(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prefSettings", orgId] });
      toast.success("Preferences updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update preferences", error);
      toast.error("Failed to update preferences.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;
    updateMutation.mutate(settings);
  };

  const handleSelectChange = (name: keyof PreferencesSettings | "theme", value: string) => {
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
              description="Customize currency formats, decimal precision, date formats, and theme appearance across your store."
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
                <Label htmlFor="theme">Theme</Label>
                <HelpTooltip text="Choose the appearance theme for your billOS interface (Light, Dark, or sync with System preferences)." />
              </div>
              <Select 
                value={(settings as PreferencesSettings).theme || "light"} 
                onValueChange={(val: string | null) => val && handleSelectChange("theme", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System (Auto)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="language">Language</Label>
                <HelpTooltip text="Select the primary language used for the interface text, tooltips, and default templates." />
              </div>
              <Select 
                value={settings.language || "en"} 
                onValueChange={(val: string | null) => val && handleSelectChange("language", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="timezone">Timezone</Label>
                <HelpTooltip text="The default timezone for timestamps on created records, audit logs, and invoice dates." />
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
