"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useOrganization } from "@/lib/use-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/tooltip";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
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


export function InvoiceSettingsForm() {
  const queryClient = useQueryClient();
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

  // Settings belong to the active organization (branch-aware), not simply the first one the user can see
  const { data: activeOrg, isLoading: loadingOrgs } = useOrganization();
  const orgId = activeOrg?.id ?? null;

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
      toast.success("Invoice settings updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update invoice settings", error);
      toast.error("Failed to update invoice settings.");
    },
    mutationFn: (payload: Partial<InvoiceSettings>) => api.put<InvoiceSettings>(`/organizations/${orgId}/settings`, payload),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !settings) return;

    const finalTerms = [...termsList];
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

  if (loadingOrgs || (orgId && loadingSettings)) {
    return <BrandLoader size="lg" text="Loading invoice settings..." variant="card" showBrandText />;
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-800/80 rounded-xl bg-slate-900/40">
        Settings not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Invoice Settings
            <PageHelpTooltip
              title="Invoice Formatting & Payment Terms"
              description="Customize invoice number prefixes, numbering formats, default payment terms, and printed bank account deposit instructions."
            />
          </h2>
          <p className="text-sm text-slate-400">Configure prefix, bank deposit details, and bullet terms for your invoices.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Invoice Configuration</CardTitle>
            <CardDescription className="text-xs text-slate-400">Configure prefix, bank details, and bullet terms for your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="max-w-md space-y-2">
              <div className="flex items-center">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <HelpTooltip text="The abbreviation prepended to your invoice numbers (e.g., INV- or ACME-)." />
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
                    <HelpTooltip text="The name of the banking institution (e.g. HDFC Bank, ICICI Bank, State Bank of India)." />
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
                    <HelpTooltip text="The official registered name of the business entity or individual holding this bank account." />
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
                    <HelpTooltip text="The complete bank account number where funds should be transferred." />
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
                    <HelpTooltip text="Indian Financial System Code (11 alphanumeric characters) used for direct NEFT/RTGS/IMPS wire transfers." />
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
                    <HelpTooltip text="The specific branch location and address details of the bank." />
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
                  <HelpTooltip text="Default bullet points printed at the bottom of every invoice (e.g. return policy, interest on delayed payments)." />
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
