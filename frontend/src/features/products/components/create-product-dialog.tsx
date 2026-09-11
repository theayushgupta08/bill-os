"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Product, ProductCategory, TaxRate } from "@/types";
import { Loader2 } from "lucide-react";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: Product) => void;
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onProductCreated,
}: CreateProductDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    basePrice: "",
    taxRateId: "",
    hsnSac: "",
    unitOfMeasure: "PCS",
    categoryId: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const data = await api.get<ProductCategory[]>("/product-categories");
      return data;
    },
  });

  const { data: taxes = [] } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const data = await api.get<TaxRate[]>("/tax-rates");
      return data;
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      basePrice: "",
      taxRateId: "",
      hsnSac: "",
      unitOfMeasure: "PCS",
      categoryId: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const selectedTax = taxes.find((t) => t.id === payload.taxRateId);
      const res = await api.post<Product>("/products", {
        name: payload.name,
        sku: payload.sku,
        basePrice: parseFloat(payload.basePrice) || 0,
        taxRate: selectedTax ? Number(selectedTax.rate) : 0,
        taxRateId: payload.taxRateId || null,
        hsnSac: payload.hsnSac || null,
        unitOfMeasure: payload.unitOfMeasure || "PCS",
        categoryId: payload.categoryId || null,
      });
      return res;
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Product "${newProduct.name}" created!`);
      onProductCreated(newProduct);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create product. Please check the details."
      );
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateSku = () => {
    const prefix = formData.name
      ? formData.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase()
      : "ITEM";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.sku.trim()) {
      toast.error("Product SKU is required");
      return;
    }
    if (!formData.basePrice || isNaN(parseFloat(formData.basePrice))) {
      toast.error("Valid selling price is required");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="product-name" className="text-slate-300">Product Name *</Label>
              <Input
                id="product-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Wireless Ergonomic Keyboard"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="product-sku" className="text-slate-300">SKU / Code *</Label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Generate
                </button>
              </div>
              <Input
                id="product-sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="KB-001"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-price" className="text-slate-300">Unit Selling Price (₹) *</Label>
              <Input
                id="product-price"
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Tax Rate (GST)</Label>
              <Select
                value={formData.taxRateId}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, taxRateId: val === "none" ? "" : (val || "") }))}
              >
                <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white">
                  <SelectValue placeholder="Select GST rate" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="none">None (0%)</SelectItem>
                  {taxes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-hsn" className="text-slate-300">HSN / SAC Code</Label>
              <Input
                id="product-hsn"
                name="hsnSac"
                value={formData.hsnSac}
                onChange={handleChange}
                placeholder="e.g. 8471"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Unit of Measure</Label>
              <Select
                value={formData.unitOfMeasure}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, unitOfMeasure: val || "PCS" }))}
              >
                <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                  <SelectItem value="BOX">Box (BOX)</SelectItem>
                  <SelectItem value="KGS">Kilograms (KGS)</SelectItem>
                  <SelectItem value="NOS">Numbers (NOS)</SelectItem>
                  <SelectItem value="MTR">Meters (MTR)</SelectItem>
                  <SelectItem value="LTR">Liters (LTR)</SelectItem>
                  <SelectItem value="SET">Set (SET)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, categoryId: val === "none" ? "" : (val || "") }))}
              >
                <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
