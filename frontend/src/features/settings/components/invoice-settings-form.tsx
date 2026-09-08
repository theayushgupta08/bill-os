"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { InvoiceSettings, Organization } from "@/types";

interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountHolder: string;
  bankAddress?: string;
}

function parseTerms(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Not JSON, parse lines
  }
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^(\d+\.|\*|-|•)\s*/, "").trim())
    .filter(Boolean);
}

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

export function InvoiceSettingsForm() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [termsList, setTermsList] = useState<string[]>([]);
  const [newTermInput, setNewTermInput] = useState("");
  const [bankFields, setBankFields] = useState<BankDetails>({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountHolder: "",
    bankAddress: "",
  });

  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<Organization[]>(`/organizations`);
      return res;
    }
  });

  const { data: invoiceSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["invoiceSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<InvoiceSettings>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrgId(orgs[0].id);
    }
  }, [orgs]);

  useEffect(() => {
    if (invoiceSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(invoiceSettings);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTermsList(parseTerms(invoiceSettings.invoiceTerms));
      
      // Parse bankDetails string
      let parsedBank: BankDetails = {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        accountHolder: "",
        bankAddress: "",
      };
      try {
        if (invoiceSettings.bankDetails) {
          const parsed = JSON.parse(invoiceSettings.bankDetails);
          if (parsed && typeof parsed === "object") {
            parsedBank = { ...parsedBank, ...parsed };
          }
        }
      } catch {
        // If parsing fails, treat the entire string as the bankName for backward compatibility
        parsedBank.bankName = invoiceSettings.bankDetails || "";
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBankFields(parsedBank);
    }
  }, [invoiceSettings]);

  const updateMutation = useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceSettings", orgId] });
      alert("Invoice settings updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update invoice settings", error);
      alert("Failed to update invoice settings.");
    },
    mutationFn: (payload: Partial<InvoiceSettings>) => api.put<InvoiceSettings>(`/organizations/${orgId}/settings`, payload),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;

    let finalTerms = [...termsList];
    if (newTermInput.trim()) {
      finalTerms.push(newTermInput.trim());
      setTermsList(finalTerms);
      setNewTermInput("");
    }

    const payload: Partial<InvoiceSettings> = {
      ...settings,
      invoiceTerms: JSON.stringify(finalTerms),
      bankDetails: JSON.stringify(bankFields),
    };

    updateMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: InvoiceSettings | null) => prev ? ({ ...prev, [name]: value }) : prev);
  };

  const handleBankFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedBank = { ...bankFields, [name]: value };
    setBankFields(updatedBank);
    
    // Serialize to JSON string for database storage
    setSettings((prev: InvoiceSettings | null) => prev ? ({
      ...prev,
      bankDetails: JSON.stringify(updatedBank),
    }) : prev);
  };

  const handleTermChange = (index: number, value: string) => {
    const updated = [...termsList];
    updated[index] = value;
    setTermsList(updated);
  };

  const handleAddTerm = () => {
    const trimmed = newTermInput.trim();
    if (!trimmed) return;
    setTermsList((prev) => [...prev, trimmed]);
    setNewTermInput("");
  };

  const handleRemoveTerm = (index: number) => {
    setTermsList((prev) => prev.filter((_, i) => i !== index));
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
            <CardDescription>Configure prefix, bank details, and bullet terms for your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="max-w-md space-y-2">
              <div className="flex items-center">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Tooltip text="The abbreviation prepended to your invoice numbers (e.g., INV- or ACME-)." />
              </div>
              <Input 
                id="invoicePrefix" 
                name="invoicePrefix" 
                placeholder="e.g. INV-"
                value={settings.invoicePrefix || ""} 
                onChange={handleChange} 
              />
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-350">Bank Account Details</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Provide the details of the bank account where customers should deposit invoice payments. These fields will format cleanly at the bottom of your printed invoices.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Tooltip text="The name of the banking institution (e.g. HDFC Bank, ICICI Bank, State Bank of India)." />
                  </div>
                  <Input 
                    id="bankName" 
                    name="bankName" 
                    placeholder="e.g. HDFC Bank"
                    value={bankFields.bankName} 
                    onChange={handleBankFieldChange} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Tooltip text="The official registered name of the business entity or individual holding this bank account." />
                  </div>
                  <Input 
                    id="accountHolder" 
                    name="accountHolder" 
                    placeholder="e.g. Acme Corporation Pvt Ltd"
                    value={bankFields.accountHolder} 
                    onChange={handleBankFieldChange} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Tooltip text="The complete bank account number where funds should be transferred." />
                  </div>
                  <Input 
                    id="accountNumber" 
                    name="accountNumber" 
                    placeholder="e.g. 50100123456789"
                    value={bankFields.accountNumber} 
                    onChange={handleBankFieldChange} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Tooltip text="Indian Financial System Code (11 alphanumeric characters) used for direct NEFT/RTGS/IMPS wire transfers." />
                  </div>
                  <Input 
                    id="ifscCode" 
                    name="ifscCode" 
                    placeholder="e.g. HDFC0001234"
                    value={bankFields.ifscCode} 
                    onChange={handleBankFieldChange} 
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center">
                    <Label htmlFor="branchName">Branch Name & Address</Label>
                    <Tooltip text="The specific branch location and address details of the bank." />
                  </div>
                  <Input 
                    id="branchName" 
                    name="branchName" 
                    placeholder="e.g. Koramangala 3rd Block, Bengaluru"
                    value={bankFields.branchName} 
                    onChange={handleBankFieldChange} 
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions (Bullet Points) */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label className="text-sm font-semibold">Terms & Conditions</Label>
                  <Tooltip text="Default bullet points printed at the bottom of every invoice (e.g. return policy, interest on delayed payments)." />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {termsList.length} {termsList.length === 1 ? "bullet point" : "bullet points"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add each invoice condition as an individual bullet item. You can edit each point directly in place.
              </p>

              <div className="space-y-2.5">
                {termsList.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 group p-1.5 rounded-lg border bg-card/60 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground text-xs font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <Input
                      value={term}
                      onChange={(e) => handleTermChange(index, e.target.value)}
                      placeholder={`Term #${index + 1}`}
                      className="flex-1 h-9 bg-transparent border-transparent hover:border-input focus:border-ring text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTerm(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      title="Delete term"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {termsList.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg bg-muted/20">
                    No terms & conditions added yet. Use the field below to add your first bullet point.
                  </div>
                )}
              </div>

              {/* Add New Bullet Input */}
              <div className="flex gap-2 pt-1">
                <Input
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTerm();
                    }
                  }}
                  placeholder="Type a new term and press Enter (e.g. Goods once sold will not be taken back)"
                  className="h-10 text-sm flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTerm}
                  variant="outline"
                  className="h-10 px-3 text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Bullet
                </Button>
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
