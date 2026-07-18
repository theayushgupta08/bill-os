"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LineItem {
  id: string;
  productId: string;
  taxRateId: string;
  quantity: number;
  unitPrice: number;
}

export function QuoteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerId: "",
    quoteNumber: "QT-" + Math.floor(Math.random() * 100000),
    quoteDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });

  const [lines, setLines] = useState<LineItem[]>([
    { id: crypto.randomUUID(), productId: "", taxRateId: "", quantity: 1, unitPrice: 0 }
  ]);

  const { data: customers = [] as any[], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get<any>("/customers");
      return res;
    }
  });

  const { data: products = [] as any[], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get<any>("/products");
      return res;
    }
  });

  const { data: taxes = [] as any[], isLoading: loadingTaxes } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const res = await api.get<any>("/tax-rates");
      return res;
    }
  });

  const initialLoading = loadingCustomers || loadingProducts || loadingTaxes;

  const handleAddLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), productId: "", taxRateId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((l: any) => l.id !== id));
    }
  };

  const handleLineChange = (id: string, field: keyof LineItem, value: any) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        if (field === "productId") {
          const product = products.find((p: any) => p.id === value);
          if (product) {
            updatedLine.unitPrice = product.basePrice || 0;
            if (product.taxRate) {
              const matchedTax = taxes.find((t: any) => Number(t.rate) === Number(product.taxRate));
              if (matchedTax) {
                updatedLine.taxRateId = matchedTax.id;
              }
            }
          }
        }
        return updatedLine;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    lines.forEach(line => {
      const lineSub = (line.quantity || 0) * (line.unitPrice || 0);
      subtotal += lineSub;
      if (line.taxRateId) {
        const tax = taxes.find((t: any) => t.id === line.taxRateId);
        if (tax) {
          taxTotal += (lineSub * (tax.rate || 0)) / 100;
        }
      }
    });

    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const totals = calculateTotals();

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/quotations", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      router.push("/sales/quotes");
      router.refresh(); // Important to refresh Server Components cache
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create Quotation");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.some(l => !l.productId)) {
      alert("Please select a product for all lines.");
      return;
    }

    const payload = {
      ...formData,
      lines: lines.map(l => ({
        productId: l.productId,
        taxRateId: l.taxRateId || null,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice)
      }))
    };

    createMutation.mutate(payload);
  };

  if (initialLoading) return <div className="p-8">Loading reference data...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2">
        <Link href="/sales/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Create Quotation</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="pt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, customerId: val }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quote Number *</Label>
              <Input
                value={formData.quoteNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, quoteNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Quote Date *</Label>
              <Input
                type="date"
                value={formData.quoteDate}
                onChange={(e) => setFormData(prev => ({ ...prev, quoteDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Product *</TableHead>
                    <TableHead className="w-[15%]">Qty *</TableHead>
                    <TableHead className="w-[15%]">Unit Price *</TableHead>
                    <TableHead className="w-[20%]">Tax Rate</TableHead>
                    <TableHead className="w-[15%] text-right">Line Total</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line: any) => {
                    const lineSub = (line.quantity || 0) * (line.unitPrice || 0);
                    let lineTax = 0;
                    if (line.taxRateId) {
                      const tax = taxes.find((t: any) => t.id === line.taxRateId);
                      if (tax) lineTax = (lineSub * (tax.rate || 0)) / 100;
                    }
                    const lineTotal = lineSub + lineTax;

                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Select 
                            value={line.productId} 
                            onValueChange={(val: any) => handleLineChange(line.id, "productId", val)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(line.id, "quantity", parseFloat(e.target.value))}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(line.id, "unitPrice", parseFloat(e.target.value))}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={line.taxRateId} 
                            onValueChange={(val: any) => handleLineChange(line.id, "taxRateId", val === "none" ? "" : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Tax</SelectItem>
                              {taxes.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.rate}%)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{lineTotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={lines.length === 1}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            <Button type="button" variant="outline" onClick={handleAddLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label>Notes / Terms</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes..."
              rows={4}
            />
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Tax</span>
                <span>₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-end">
          <Link href="/sales/quotes">
            <Button type="button" variant="outline" disabled={createMutation.isPending}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
