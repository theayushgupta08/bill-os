"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Customer, Product, TaxRate, Warehouse, Organization } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash, ArrowLeft, Building2, FileText, ExternalLink, Package, Layers, Lock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLoader } from "@/components/ui/loader";
import { ProductCombobox } from "./product-combobox";
import { CustomerCombobox } from "./customer-combobox";
import { WarehouseCombobox } from "./warehouse-combobox";
import { cn } from "@/lib/utils";

interface LineItem {
  id: string;
  productId: string;
  warehouseId: string;
  taxRateId: string;
  quantity: number;
  unitPrice: number;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  accountHolder?: string;
  bankAddress?: string;
}

export function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const soId = searchParams.get("soId");
  const queryClient = useQueryClient();

  // Consolidated Tax toggle: true by default
  const [isConsolidatedTax, setIsConsolidatedTax] = useState(true);
  const [consolidatedTaxRateId, setConsolidatedTaxRateId] = useState<string>("");

  const [formData, setFormData] = useState(() => ({
    customerId: "",
    soId: soId || "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  }));

  const [lines, setLines] = useState<LineItem[]>([
    { id: crypto.randomUUID(), productId: "", warehouseId: "", taxRateId: "", quantity: 1, unitPrice: 0 }
  ]);

  // Queries
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get<Customer[]>("/customers");
      return res;
    }
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get<Product[]>("/products");
      return res;
    }
  });

  const { data: taxes = [], isLoading: loadingTaxes } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const res = await api.get<TaxRate[]>("/tax-rates");
      return res;
    }
  });

  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get<Warehouse[]>("/warehouses");
      return res;
    }
  });

  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await api.get<Organization[]>("/organizations");
      return res;
    }
  });

  const orgId = orgs?.[0]?.id;
  const currentOrg = orgs?.[0];

  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoiceSettings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await api.get<any>(`/organizations/${orgId}/settings`);
      return res;
    },
    enabled: !!orgId
  });

  // Query sales invoices for sequential numbering fallback & history
  const { data: existingInvoices = [] } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      const res = await api.get<any[]>("/sales-invoices");
      return res || [];
    }
  });

  // Query backend next invoice number preview
  const { data: nextNumberData } = useQuery({
    queryKey: ["next-invoice-number", orgId],
    queryFn: async () => {
      try {
        const res = await api.get<{ nextInvoiceNumber: string }>("/sales-invoices/next-number");
        return res?.nextInvoiceNumber;
      } catch {
        return null;
      }
    },
    enabled: !!orgId,
  });

  // Company Invoice Prefix from settings (default "INV-")
  const companyPrefix = useMemo(() => {
    return invoiceSettings?.invoicePrefix?.trim() || "INV-";
  }, [invoiceSettings?.invoicePrefix]);

  // System-generated sequential invoice number: Prefix + 0001, 0002...
  const sequentialInvoiceNumber = useMemo(() => {
    if (nextNumberData) return nextNumberData;

    if (!existingInvoices || existingInvoices.length === 0) {
      return `${companyPrefix}0001`;
    }

    const sequenceNumbers = existingInvoices
      .map((inv: any) => inv.invoiceNumber)
      .filter(Boolean)
      .map((numStr: string) => {
        if (numStr.toLowerCase().startsWith(companyPrefix.toLowerCase())) {
          const suffix = numStr.substring(companyPrefix.length);
          const parsed = parseInt(suffix, 10);
          return isNaN(parsed) ? null : parsed;
        }
        const match = numStr.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n: number | null): n is number => n !== null);

    const highest = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    const nextSeq = highest + 1;
    return `${companyPrefix}${String(nextSeq).padStart(4, "0")}`;
  }, [nextNumberData, existingInvoices, companyPrefix]);

  // Sync sequential invoice number into formData
  useEffect(() => {
    if (sequentialInvoiceNumber) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: sequentialInvoiceNumber,
      }));
    }
  }, [sequentialInvoiceNumber]);

  // Default tax rate (from org settings or 18% GST standard or first active)
  const defaultTaxRate = useMemo(() => {
    if (!taxes || taxes.length === 0) return null;
    if (invoiceSettings?.defaultGstRate) {
      const matched = taxes.find(
        (t) => Math.abs(Number(t.rate) - Number(invoiceSettings.defaultGstRate)) < 0.01
      );
      if (matched) return matched;
    }
    return taxes.find((t) => Number(t.rate) === 18) || taxes[0];
  }, [taxes, invoiceSettings?.defaultGstRate]);

  // Pre-select default tax rate in consolidated tax mode
  useEffect(() => {
    if (defaultTaxRate && !consolidatedTaxRateId) {
      setConsolidatedTaxRateId(defaultTaxRate.id);
    }
  }, [defaultTaxRate, consolidatedTaxRateId]);

  // Default warehouse (Main / code=MAIN / first)
  const defaultWarehouse = useMemo(() => {
    if (!warehouses || warehouses.length === 0) return null;
    return (
      warehouses.find((w) => w.code === "MAIN" || w.name?.toLowerCase().includes("main")) ||
      warehouses[0]
    );
  }, [warehouses]);

  // Autopopulate default warehouse on initial lines
  useEffect(() => {
    if (defaultWarehouse) {
      setLines((prevLines) =>
        prevLines.map((line) => ({
          ...line,
          warehouseId: line.warehouseId || defaultWarehouse.id,
        }))
      );
    }
  }, [defaultWarehouse]);

  const initialLoading = loadingCustomers || loadingProducts || loadingTaxes || loadingWarehouses;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        warehouseId: defaultWarehouse?.id || "",
        taxRateId: isConsolidatedTax ? consolidatedTaxRateId : "",
        quantity: 1,
        unitPrice: 0,
      }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // Dedicated Product selection handler: auto-populates unitPrice and tax rate
  const handleProductSelect = (lineId: string, productId: string, product?: Product) => {
    const prod = product || products.find((p) => p.id === productId);
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (!productId || !prod) {
          return { ...line, productId: "", unitPrice: 0 };
        }

        // Auto-populate price from product (can be edited directly in the table)
        const autoPrice = Number(prod.price ?? prod.basePrice ?? 0);

        // Auto-populate tax rate (for product-specific tax mode)
        let resolvedTaxRateId = line.taxRateId;
        if (prod.taxRateId) {
          resolvedTaxRateId = prod.taxRateId;
        } else if (prod.taxRate !== undefined && prod.taxRate !== null && taxes.length > 0) {
          const match = taxes.find(
            (t) => Math.abs(Number(t.rate) - Number(prod.taxRate)) < 0.01
          );
          if (match) {
            resolvedTaxRateId = match.id;
          }
        }

        return {
          ...line,
          productId: prod.id,
          unitPrice: autoPrice,
          taxRateId: isConsolidatedTax ? line.taxRateId : (resolvedTaxRateId || line.taxRateId),
        };
      })
    );
  };

  // General field change (e.g. quantity, unitPrice, warehouseId, taxRateId)
  const handleLineChange = (id: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  // Switch between Consolidated and Product-Specific Tax Mode
  const handleSwitchTaxMode = (consolidated: boolean) => {
    setIsConsolidatedTax(consolidated);
    if (!consolidated) {
      // In product specific mode, ensure any existing line with a product has its tax rate auto-populated
      setLines((prev) =>
        prev.map((line) => {
          if (!line.productId) return line;
          const prod = products.find((p) => p.id === line.productId);
          if (!prod) return line;

          let targetTaxId = line.taxRateId;
          if (prod.taxRateId) {
            targetTaxId = prod.taxRateId;
          } else if (prod.taxRate !== undefined && prod.taxRate !== null && taxes.length > 0) {
            const match = taxes.find(
              (t) => Math.abs(Number(t.rate) - Number(prod.taxRate)) < 0.01
            );
            if (match) targetTaxId = match.id;
          }
          return {
            ...line,
            taxRateId: targetTaxId || line.taxRateId,
          };
        })
      );
    }
  };

  // Check interstate status
  const selectedCustomer = customers.find((c) => c.id === formData.customerId);
  const isInterState = useMemo(() => {
    if (!currentOrg?.state || !selectedCustomer?.billingState) return false;
    return currentOrg.state.trim().toLowerCase() !== selectedCustomer.billingState.trim().toLowerCase();
  }, [currentOrg, selectedCustomer]);

  // Calculate Totals & GST breakdown
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    lines.forEach((line) => {
      const lineSub = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      subtotal += lineSub;

      const activeTaxRateId = isConsolidatedTax ? consolidatedTaxRateId : line.taxRateId;
      if (activeTaxRateId) {
        const tax = taxes.find((t) => t.id === activeTaxRateId);
        if (tax) {
          taxTotal += (lineSub * (Number(tax.rate) || 0)) / 100;
        }
      }
    });

    // Division into CGST, SGST, IGST
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = taxTotal;
    } else {
      cgstAmount = taxTotal / 2;
      sgstAmount = taxTotal / 2;
    }

    return {
      subtotal,
      taxTotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total: subtotal + taxTotal,
    };
  }, [lines, isConsolidatedTax, consolidatedTaxRateId, taxes, isInterState]);

  // Product count & quantity count
  const productCount = useMemo(() => {
    return lines.filter((l) => Boolean(l.productId)).length;
  }, [lines]);

  const totalQuantity = useMemo(() => {
    return lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  }, [lines]);

  // Parse Bank Details
  const parsedBank: BankDetails = useMemo(() => {
    if (!invoiceSettings?.bankDetails) {
      return { bankName: "", accountNumber: "", ifscCode: "" };
    }
    try {
      const parsed = JSON.parse(invoiceSettings.bankDetails);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return { bankName: invoiceSettings.bankDetails, accountNumber: "", ifscCode: "" };
    }
    return { bankName: "", accountNumber: "", ifscCode: "" };
  }, [invoiceSettings]);

  // Parse Terms
  const parsedTerms = useMemo(() => {
    if (!invoiceSettings?.invoiceTerms) return [];
    return invoiceSettings.invoiceTerms
      .split("\n")
      .map((t: string) => t.trim().replace(/^[-*•]\s*/, ""))
      .filter((t: string) => t.length > 0);
  }, [invoiceSettings]);

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post("/sales-invoices", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast.success("Sales Invoice created successfully!");
      router.push("/sales/invoices");
      router.refresh();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create invoice");
    }
  });

  const handleSubmit = (e: React.FormEvent, status: "DRAFT" | "ISSUED") => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (lines.some((l) => !l.productId || !l.warehouseId)) {
      toast.error("Please select a product and a shipping warehouse for all lines.");
      return;
    }

    const payload = {
      ...formData,
      invoiceNumber: formData.invoiceNumber || sequentialInvoiceNumber,
      status,
      notes: invoiceSettings?.invoiceTerms || "",
      lines: lines.map((l) => ({
        productId: l.productId,
        warehouseId: l.warehouseId,
        taxRateId: isConsolidatedTax
          ? (consolidatedTaxRateId || null)
          : (l.taxRateId || null),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    };

    createMutation.mutate(payload);
  };

  if (initialLoading) return <PageLoader text="Loading invoice form..." showBrandText />;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-[1400px] mx-auto text-slate-100">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/sales/invoices">
            <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Create Sales Invoice</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Issue GST-compliant sales invoices, allocate stock, and track receivables.
            </p>
          </div>
        </div>

        {/* Consolidated vs Product Specific Tax Rate Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <span className="text-xs text-slate-400 font-medium px-2">Tax Mode:</span>
          <button
            type="button"
            onClick={() => handleSwitchTaxMode(true)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
              isConsolidatedTax
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Consolidated Tax Rate</span>
            {defaultTaxRate && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-normal",
                  isConsolidatedTax
                    ? "bg-indigo-700/90 text-indigo-100"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {defaultTaxRate.rate}% Default
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTaxMode(false)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
              !isConsolidatedTax
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Product-Specific Tax Rate
          </button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Top Header Card */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm relative z-30 overflow-visible">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-visible">
            {/* Searchable Customer Combobox */}
            <div className="space-y-1.5 md:col-span-2 relative z-50">
              <Label className="text-xs font-medium text-slate-300">Customer *</Label>
              <CustomerCombobox
                customers={customers}
                value={formData.customerId}
                onChange={(val) => setFormData((prev) => ({ ...prev, customerId: val }))}
              />
            </div>


            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-indigo-400" />
                  Invoice Number *
                </Label>
                <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  System Generated
                </span>
              </div>
              <Input
                value={formData.invoiceNumber || sequentialInvoiceNumber}
                readOnly
                disabled
                tabIndex={-1}
                title="System generated sequential invoice number cannot be edited"
                className="bg-slate-950/80 border-slate-800 text-indigo-300 font-mono text-xs cursor-not-allowed select-none opacity-95 focus-visible:ring-0 focus-visible:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Invoice Date *</Label>
              <Input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                required
                className="bg-slate-950/60 border-slate-800 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
                className="bg-slate-950/60 border-slate-800 text-white text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Table with Sticky Header */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm relative z-20 overflow-visible">
          <CardContent className="pt-6 space-y-4 overflow-visible">

            <div className="overflow-visible relative rounded-md border border-slate-800 bg-slate-950/40 shadow-sm">
              <Table containerClassName="overflow-visible">
                <TableHeader className="sticky top-0 z-20 bg-slate-900 shadow-md">
                  <TableRow className="border-b border-slate-800 hover:bg-transparent">
                    <TableHead className="w-[30%] text-slate-300 font-semibold text-xs py-3">Product *</TableHead>
                    <TableHead className="w-[22%] text-slate-300 font-semibold text-xs py-3">Ship From Whs *</TableHead>
                    <TableHead className="w-[12%] text-slate-300 font-semibold text-xs py-3">Qty *</TableHead>
                    <TableHead className="w-[16%] text-slate-300 font-semibold text-xs py-3">Unit Price (₹) *</TableHead>
                    {!isConsolidatedTax && (
                      <TableHead className="w-[14%] text-slate-300 font-semibold text-xs py-3">Tax Rate</TableHead>
                    )}
                    <TableHead className="w-[16%] text-right text-slate-300 font-semibold text-xs py-3">Line Total</TableHead>
                    <TableHead className="w-[4%] py-3"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="overflow-visible">
                  {lines.map((line: LineItem) => {
                    const lineSub = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                    let lineTax = 0;

                    const activeTaxId = isConsolidatedTax ? consolidatedTaxRateId : line.taxRateId;
                    if (activeTaxId) {
                      const tax = taxes.find((t) => t.id === activeTaxId);
                      if (tax) lineTax = (lineSub * (Number(tax.rate) || 0)) / 100;
                    }
                    const lineTotal = isConsolidatedTax ? lineSub : lineSub + lineTax;

                    return (
                      <TableRow
                        key={line.id}
                        className="border-b border-slate-800/60 hover:bg-white/5 transition-colors relative focus-within:z-30 overflow-visible"
                      >
                        {/* Searchable Product Combobox */}
                        <TableCell className="py-2.5 overflow-visible">
                          <ProductCombobox
                            products={products}
                            value={line.productId}
                            onChange={(val, prod) => handleProductSelect(line.id, val, prod)}
                          />
                        </TableCell>

                        {/* Searchable Warehouse Combobox */}
                        <TableCell className="py-2.5 overflow-visible">
                          <WarehouseCombobox
                            warehouses={warehouses}
                            value={line.warehouseId}
                            onChange={(val) => handleLineChange(line.id, "warehouseId", val)}
                            placeholder="Select warehouse..."
                          />
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="py-2.5">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(line.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            required
                            className="bg-slate-950/60 border-slate-800 text-white font-mono text-xs"
                          />
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell className="py-2.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) =>
                              handleLineChange(line.id, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            required
                            className="bg-slate-950/60 border-slate-800 text-white font-mono text-xs"
                          />
                        </TableCell>

                        {/* Product Specific Tax Rate Column (hidden in Consolidated Mode) */}
                        {!isConsolidatedTax && (
                          <TableCell className="py-2.5">
                            <Select
                              value={line.taxRateId || "none"}
                              onValueChange={(val) =>
                                handleLineChange(line.id, "taxRateId", val === "none" ? "" : (val || ""))
                              }
                            >
                              <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white text-xs">
                                <SelectValue placeholder="None">
                                  {(val) => {
                                    if (!val || val === "none") return "None (0%)";
                                    const t = taxes.find((tax) => tax.id === val);
                                    if (!t) return "None (0%)";
                                    return t.name.includes(`${t.rate}%`) ? t.name : `${t.name} (${t.rate}%)`;
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                                <SelectItem value="none">None (0%)</SelectItem>
                                {taxes.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name} ({t.rate}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}

                        {/* Line Total */}
                        <TableCell className="text-right font-medium font-mono text-xs text-white py-2.5">
                          ₹{lineTotal.toFixed(2)}
                        </TableCell>

                        {/* Remove Action */}
                        <TableCell className="py-2.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={lines.length === 1}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer: Add Line Button & Live Counters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLine}
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Line
              </Button>

              {/* Product Count and Total Quantity Counters */}
              <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Products:</span>
                  <span className="font-semibold text-white">{productCount}</span>
                </div>
                <div className="h-3 w-px bg-slate-800" />
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total Quantity:</span>
                  <span className="font-semibold text-white font-mono">{totalQuantity}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section: Bank Details + Terms Cards on Left, Totals on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Organization Bank Details & Terms & Conditions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Bank Details Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Bank Account Details</h3>
                    <p className="text-[11px] text-slate-400">Payment instructions printed on invoice</p>
                  </div>
                </div>
                <Link href="/settings/invoice">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                  >
                    <span>Edit</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {parsedBank.bankName || parsedBank.accountNumber ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Bank Name:</span>
                    <p className="font-medium text-white">{parsedBank.bankName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Number:</span>
                    <p className="font-mono font-medium text-white">{parsedBank.accountNumber || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">IFSC Code:</span>
                    <p className="font-mono font-medium text-white">{parsedBank.ifscCode || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Holder:</span>
                    <p className="font-medium text-white">{parsedBank.accountHolder || currentOrg?.name || "—"}</p>
                  </div>
                  {parsedBank.branchName && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Branch:</span>
                      <p className="font-medium text-white">{parsedBank.branchName}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>No bank deposit details configured in organization settings.</span>
                  <Link href="/settings/invoice" className="text-indigo-400 hover:underline">
                    Add Bank Details
                  </Link>
                </div>
              )}
            </div>

            {/* Terms and Conditions Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Terms & Conditions</h3>
                    <p className="text-[11px] text-slate-400">Default commercial terms applied to this invoice</p>
                  </div>
                </div>
                <Link href="/settings/invoice">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                  >
                    <span>Edit</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {parsedTerms.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {parsedTerms.map((term: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>No custom terms & conditions configured in organization settings.</span>
                  <Link href="/settings/invoice" className="text-indigo-400 hover:underline">
                    Add Terms
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Subtotal & Tax Breakdown Card */}
          <div className="lg:col-span-5">
            <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-sm sticky top-6">
              <CardContent className="pt-6 space-y-3 text-xs">
                {/* Consolidated Tax Selector inside Summary */}
                {isConsolidatedTax && (
                  <div className="pb-3 border-b border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 font-medium text-xs">
                        Consolidated Tax Rate (GST)
                      </Label>
                      {defaultTaxRate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">
                          Default: {defaultTaxRate.rate}%
                        </span>
                      )}
                    </div>
                    <Select
                      value={consolidatedTaxRateId}
                      onValueChange={(val) => val && setConsolidatedTaxRateId(val)}
                    >
                      <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white text-xs">
                        <SelectValue placeholder="Select Tax Rate">
                          {(val) => {
                            if (!val) return "Select Tax Rate";
                            const t = taxes.find((tax) => tax.id === val);
                            if (!t) return "Select Tax Rate";
                            return t.name.includes(`${t.rate}%`) ? t.name : `${t.name} (${t.rate}%)`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                        {taxes.map((t) => {
                          const isDefault = defaultTaxRate?.id === t.id;
                          return (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.rate}%) {isDefault ? "★ Default" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">₹{totals.subtotal.toFixed(2)}</span>
                </div>

                {/* Divided Total Tax Section */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between font-medium text-slate-200">
                    <span>Total Tax</span>
                    <span className="font-mono text-emerald-400">₹{totals.taxTotal.toFixed(2)}</span>
                  </div>

                  {/* Three-part Tax Breakdown: CGST, SGST, IGST */}
                  <div className="pl-3 border-l-2 border-indigo-500/40 space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>CGST (Central Tax)</span>
                      <span className="font-mono text-slate-300">₹{totals.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (State Tax)</span>
                      <span className="font-mono text-slate-300">₹{totals.sgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGST (Integrated Tax)</span>
                      <span className="font-mono text-slate-300">₹{totals.igstAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between font-bold text-base text-white">
                  <span>Grand Total</span>
                  <span className="font-mono text-indigo-400">₹{totals.total.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  <Link href="/sales/invoices" className="flex-1">
                    <Button type="button" variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createMutation.isPending}
                    onClick={(e) => handleSubmit(e, "DRAFT")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs"
                  >
                    {createMutation.isPending ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={(e) => handleSubmit(e, "ISSUED")}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    {createMutation.isPending ? "Issuing..." : "Issue Invoice"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
