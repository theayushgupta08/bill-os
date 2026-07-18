"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProductFormProps {
  productId?: string; // If provided, it's in edit mode
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    hsnSac: "",
    basePrice: 0,
    taxRate: 0,
    unitOfMeasure: "",
    categoryId: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const data: any = await api.get("/product-categories");
      return data;
    },
  });

  const { data: product, isLoading: isFetching } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const data: any = await api.get(`/products/${productId}`);
      return data;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        hsnSac: product.hsnSac || "",
        basePrice: product.basePrice || 0,
        taxRate: product.taxRate || 0,
        unitOfMeasure: product.unitOfMeasure || "",
        categoryId: product.categoryId || "",
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
      };
      if (productId) {
        return api.put(`/products/${productId}`, payload);
      } else {
        return api.post("/products", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/products");
    },
    onError: (error) => {
      console.error("Failed to save product:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base Price *</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" value={formData.basePrice} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%) *</Label>
          <Input id="taxRate" name="taxRate" type="number" step="0.01" value={formData.taxRate} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hsnSac">HSN / SAC</Label>
          <Input id="hsnSac" name="hsnSac" value={formData.hsnSac} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unit of Measure (UOM)</Label>
          <Input id="unitOfMeasure" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/products")} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
