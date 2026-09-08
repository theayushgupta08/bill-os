"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Settings, Plus } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/tooltip";
import { TaxRate } from "@/types";

export default function TaxSettingsAndRatesPage() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");
  const [isAddingTax, setIsAddingTax] = useState(false);

  // Fetch Organizations
  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<any>(`/organizations`);
      return res;
    }
  });

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      setOrgId(orgs[0].id);
    }
  }, [orgs]);

  // Fetch Tax Rates
  const { data: taxes = [], isLoading: loadingTaxes, refetch: refetchTaxes } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const data = await api.get<TaxRate[]>("/tax-rates");
      return data as TaxRate[];
    }
  });

  // Fetch Organization Tax Settings
  const { data: taxSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["taxSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<any>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  // Save Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: unknown) => api.put(`/organizations/${orgId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings", orgId] });
      toast.success("Tax configurations updated successfully!");
    },
    onError: (error: unknown) => {
      console.error("Failed to update tax settings", error);
      toast.error("Failed to save tax configurations.");
    }
  });

  // Automatically enforce default tax rate rule
  useEffect(() => {
    if (taxes && taxes.length > 0 && taxSettings && orgId) {
      const activeTaxes = taxes.filter(t => t.isActive);
      
      // Rule 1: If there is only one active tax rate, that is the default
      if (activeTaxes.length === 1) {
        const singleRate = activeTaxes[0].rate;
        if (taxSettings.defaultGstRate !== singleRate) {
          updateSettingsMutation.mutate({
            ...taxSettings,
            defaultGstRate: singleRate
          });
        }
      } 
      // Rule 2: If defaultGstRate is not set but we have active rates, set the first one as default
      else if (!taxSettings.defaultGstRate && activeTaxes.length > 0) {
        updateSettingsMutation.mutate({
          ...taxSettings,
          defaultGstRate: activeTaxes[0].rate
        });
      }
    }
  }, [taxes, taxSettings, orgId]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !taxSettings) return;
    updateSettingsMutation.mutate(taxSettings);
  };

  const handleAddTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName || !newTaxRate) return;
    setIsAddingTax(true);
    try {
      const rateNum = Number(newTaxRate);
      await api.post("/tax-rates", { name: newTaxName, rate: rateNum, isActive: true });
      setNewTaxName("");
      setNewTaxRate("");
      toast.success("Tax rate added successfully!");
      refetchTaxes();
    } catch (error: unknown) {
      console.error("Failed to add tax rate", error);
      toast.error("Failed to add tax rate.");
    } finally {
      setIsAddingTax(false);
    }
  };

  const handleDefaultGstChange = (val: string) => {
    if (!taxSettings) return;
    const rateVal = val ? Number(val) : null;
    queryClient.setQueryData(["taxSettings", orgId], {
      ...taxSettings,
      defaultGstRate: rateVal
    });
  };

  const handleInclusivePricingChange = (checked: boolean) => {
    if (!taxSettings) return;
    queryClient.setQueryData(["taxSettings", orgId], {
      ...taxSettings,
      taxInclusivePricing: checked
    });
  };

  if (loadingOrgs || loadingTaxes || (orgId && loadingSettings)) {
    return (
      <BrandLoader size="lg" text="Loading tax settings..." variant="card" showBrandText />
    );
  }

  const activeTaxes = taxes.filter(t => t.isActive);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Percent className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tax Settings & Rates</h2>
          <p className="text-sm text-slate-400">Configure tax compliance behaviors and manage master tax rate codes.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Tax Configuration Form (1/3 width) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Configurations
              </CardTitle>
              <CardDescription className="text-xs text-slate-450 leading-relaxed">
                Configure default tax rules for sales and purchases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-5">
                {/* Default GST Rate Select */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="defaultGstRate" className="text-slate-350 text-xs">Default Tax Code</Label>
                    <HelpTooltip text="Select the default tax rate code pre-filled when creating invoices or items." />
                  </div>
                  <select
                    id="defaultGstRate"
                    value={taxSettings?.defaultGstRate ?? ""}
                    onChange={(e) => handleDefaultGstChange(e.target.value)}
                    disabled={activeTaxes.length <= 1}
                    className="w-full bg-slate-850 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {activeTaxes.length === 0 ? (
                      <option value="">No Active Rates</option>
                    ) : (
                      <>
                        <option value="">Select Default Rate</option>
                        {activeTaxes.map((t) => (
                          <option key={t.id} value={t.rate}>
                            {t.name} ({t.rate}%)
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {activeTaxes.length === 1 && (
                    <p className="text-[10px] text-indigo-400 italic">
                      Locked: Only one tax rate exists, automatically set as default.
                    </p>
                  )}
                </div>

                {/* Tax Inclusive Pricing Checkbox */}
                <div className="flex items-center space-x-2.5 pt-1">
                  <Checkbox 
                    id="taxInclusivePricing" 
                    checked={taxSettings?.taxInclusivePricing || false}
                    onCheckedChange={handleInclusivePricingChange}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="taxInclusivePricing" className="font-normal text-xs text-slate-350 cursor-pointer select-none">
                      Tax Inclusive Default
                    </Label>
                    <HelpTooltip text="When checked, transaction item pricing includes calculated taxes by default." />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending} 
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tax Rates Master Table & Add rate Form (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          {/* Add Tax Rate Form */}
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add New Tax Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTaxRate} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex items-center">
                    <Label className="text-slate-350 text-xs">Tax Name</Label>
                    <HelpTooltip text="The name tag of this tax rate (e.g. GST 18%, VAT 5%)." />
                  </div>
                  <Input 
                    value={newTaxName} 
                    onChange={e => setNewTaxName(e.target.value)} 
                    required 
                    placeholder="e.g. GST 18%" 
                    className="h-9 bg-slate-850 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 text-xs" 
                  />
                </div>
                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex items-center">
                    <Label className="text-slate-350 text-xs">Rate (%)</Label>
                    <HelpTooltip text="The exact decimal percentage rate of tax (e.g. 18.00)." />
                  </div>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={newTaxRate} 
                    onChange={e => setNewTaxRate(e.target.value)} 
                    required 
                    placeholder="18.00" 
                    className="h-9 bg-slate-850 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 text-xs" 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAddingTax}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 rounded-lg font-medium text-xs px-4"
                >
                  {isAddingTax ? "Adding..." : "Add Tax Rate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Master Tax Rates Table */}
          <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <Table>
              <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
                <TableRow>
                  <TableHead className="text-slate-400 font-semibold pl-6 text-xs">Tax Code Name</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs">Percentage Rate</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs pr-6 text-right">Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500 text-xs">
                      No tax rates configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxes.map((t) => {
                    const isDefault = taxSettings?.defaultGstRate === t.rate;
                    return (
                      <TableRow key={t.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <TableCell className="font-semibold text-white pl-6 py-3.5 text-xs">{t.name}</TableCell>
                        <TableCell className="text-slate-300 font-mono text-xs">{t.rate}%</TableCell>
                        <TableCell>
                          {t.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border border-slate-500/20 font-semibold text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          {isDefault ? (
                            <Badge className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                              Default
                            </Badge>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
