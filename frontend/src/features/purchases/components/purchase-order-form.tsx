"use client";



import { Product, Supplier, TaxRate } from "@/types";
import { useFormat } from "@/lib/use-format";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
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
import { PageLoader } from "@/components/ui/loader";

interface LineItem {
  id: string; // client-side temp id
  productId: string;
  taxRateId: string;
  quantity: number;
  unitPrice: number;
}

export function PurchaseOrderForm() {
  const { formatMoney } = useFormat();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(() => ({
    supplierId: "",
    poNumber: "PO-" + Math.floor(Math.random() * 100000),
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    notes: "",
  }));

  const [lines, setLines] = useState<LineItem[]>(() => [
    { id: crypto.randomUUID(), productId: "", taxRateId: "", quantity: 1, unitPrice: 0 }
  ]);

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await api.get<Supplier[]>("/suppliers");
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

  const initialLoading = loadingSuppliers || loadingProducts || loadingTaxes;

  const handleAddLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), productId: "", taxRateId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((l: LineItem) => l.id !== id));
    }
  };

  const handleLineChange = (id: string, field: keyof LineItem, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            updatedLine.unitPrice = product.basePrice || 0;
            if (product.taxRate) {
              const matchedTax = taxes.find((t) => Number(t.rate) === Number(product.taxRate));
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
        const tax = taxes.find((t) => t.id === line.taxRateId);
        if (tax) {
          taxTotal += (lineSub * (tax.rate || 0)) / 100;
        }
      }
    });

    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const totals = calculateTotals();

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post("/purchase-orders", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created successfully!");
      router.push("/purchases/orders");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create PO");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.some(l => !l.productId)) {
      toast.error("Please select a product for all lines.");
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

  if (initialLoading) return <PageLoader text="Loading purchase order form..." showBrandText />;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2">
        <Link href="/purchases/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Create Purchase Order</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="pt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select 
                value={formData.supplierId} 
                onValueChange={(val: string | null) => val && setFormData(prev => ({ ...prev, supplierId: val }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PO Number *</Label>
              <Input
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Order Date *</Label>
              <Input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
                  {lines.map((line: LineItem) => {
                    const lineSub = (line.quantity || 0) * (line.unitPrice || 0);
                    let lineTax = 0;
                    if (line.taxRateId) {
                      const tax = taxes.find((t) => t.id === line.taxRateId);
                      if (tax) lineTax = (lineSub * (tax.rate || 0)) / 100;
                    }
                    const lineTotal = lineSub + lineTax;

                    return (
                      <TableRow key={line.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <Select 
                            value={line.productId} 
                            onValueChange={(val: string | null) => val && handleLineChange(line.id, "productId", val)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
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
                            onValueChange={(val: string | null) => val && handleLineChange(line.id, "taxRateId", val === "none" ? "" : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Tax</SelectItem>
                              {taxes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.rate}%)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(lineTotal)}
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
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Tax</span>
                <span>{formatMoney(totals.taxTotal)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>{formatMoney(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-end">
          <Link href="/purchases/orders">
            <Button type="button" variant="outline" disabled={createMutation.isPending}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
