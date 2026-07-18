"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function InventoryAdjustForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    warehouseId: "",
    productId: "",
    movementType: "ADJUSTMENT",
    quantity: "", // Can be positive or negative
    reason: "",
    referenceType: "MANUAL",
  });

  const { data: warehouses = [] as any[], isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get<any>("/warehouses");
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

  const adjustMutation = useMutation({
    mutationFn: (payload: any) => api.post("/inventory/adjust", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-levels"] });
      router.push("/inventory");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to post adjustment", error);
      alert("Failed to adjust stock. See console.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      quantity: Number(formData.quantity)
    };
    adjustMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loadingWarehouses || loadingProducts) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Manual Stock Adjustment</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mt-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Warehouse *</Label>
            <Select 
              value={formData.warehouseId} 
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, warehouseId: val }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select 
              value={formData.productId} 
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, productId: val }))}
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Adjustment Quantity (+ / -) *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              required
              placeholder="e.g. 5 or -2"
            />
            <p className="text-sm text-muted-foreground">Use negative values to deduct stock.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Memo *</Label>
            <Input
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="e.g. Stock count discrepancy"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={adjustMutation.isPending || !formData.warehouseId || !formData.productId}>
            {adjustMutation.isPending ? "Posting..." : "Confirm Adjustment"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/inventory")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
