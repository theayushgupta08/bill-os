"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function PreferencesSettingsForm() {
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

  const { data: prefSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["prefSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<any>(`/organizations/${orgId}/settings`);
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
    mutationFn: (payload: any) => api.put(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prefSettings", orgId] });
      alert("Preferences updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update preferences", error);
      alert("Failed to update preferences.");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;
    updateMutation.mutate(settings);
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  if (loadingOrgs || (orgId && loadingSettings)) return <div className="p-8">Loading settings...</div>;
  if (!settings) return <div className="p-8">Settings not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-2xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Preferences</h2>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>User & System Preferences</CardTitle>
            <CardDescription>Customize how BillOS looks and formats data for your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="theme">Theme</Label>
                <Tooltip text="Choose the appearance theme for your billOS interface (Light, Dark, or sync with System preferences)." />
              </div>
              <Select 
                value={settings.theme || "light"} 
                onValueChange={(val: any) => handleSelectChange("theme", val)}
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
                <Tooltip text="Select the primary language used for the interface text, tooltips, and default templates." />
              </div>
              <Select 
                value={settings.language || "en"} 
                onValueChange={(val: any) => handleSelectChange("language", val)}
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
                <Tooltip text="The default timezone for timestamps on created records, audit logs, and invoice dates." />
              </div>
              <Select 
                value={settings.timezone || "Asia/Kolkata"} 
                onValueChange={(val: any) => handleSelectChange("timezone", val)}
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
                <Tooltip text="Select how dates should be formatted in all tables, invoices, and reports." />
              </div>
              <Select 
                value={settings.dateFormat || "DD/MM/YYYY"} 
                onValueChange={(val: any) => handleSelectChange("dateFormat", val)}
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
