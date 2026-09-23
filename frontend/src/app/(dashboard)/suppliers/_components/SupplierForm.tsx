"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@/types";
import { PageLoader } from "@/components/ui/loader";

interface SupplierFormProps {
  supplierId?: string; // If provided, it's in edit mode
}

export default function SupplierForm({ supplierId }: SupplierFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  const { data: supplier, isLoading: isFetching } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => {
      const data = await api.get<Supplier>(`/suppliers/${supplierId}`);
      return data;
    },
    enabled: !!supplierId,
  });

  // Copy freshly fetched data into the editable form state (render-time sync instead of an effect)
  const [syncedSupplier, setSyncedSupplier] = useState<typeof supplier>(undefined);
  if (supplier && supplier !== syncedSupplier) {
    setSyncedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      gstin: supplier.gstin || "",
      addressLine1: supplier.addressLine1 || "",
      addressLine2: supplier.addressLine2 || "",
      city: supplier.city || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      country: supplier.country || "",
    });
  }

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (supplierId) {
        return api.put(`/suppliers/${supplierId}`, data);
      } else {
        return api.post("/suppliers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      router.push("/suppliers");
    },
    onError: (error) => {
      console.error("Failed to save supplier:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isFetching) {
    return <PageLoader text="Loading supplier details..." showBrandText />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={formData.country} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/suppliers")} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Supplier"}
        </Button>
      </div>
    </form>
  );
}
