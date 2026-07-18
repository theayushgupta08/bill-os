"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface CustomerFormProps {
  customerId?: string; // If provided, it's in edit mode
}

export default function CustomerForm({ customerId }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstin: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingPincode: "",
    billingCountry: "",
  });

  const { data: customer, isLoading: isFetching } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const data: any = await apiClient.get(`/customers/${customerId}`);
      return data;
    },
    enabled: !!customerId,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        gstin: customer.gstin || "",
        billingAddressLine1: customer.billingAddressLine1 || "",
        billingAddressLine2: customer.billingAddressLine2 || "",
        billingCity: customer.billingCity || "",
        billingState: customer.billingState || "",
        billingPincode: customer.billingPincode || "",
        billingCountry: customer.billingCountry || "",
      });
    }
  }, [customer]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (customerId) {
        return apiClient.put(`/customers/${customerId}`, data);
      } else {
        return apiClient.post("/customers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/customers");
    },
    onError: (error) => {
      console.error("Failed to save customer:", error);
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
    return <div>Loading...</div>;
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
        <h3 className="text-lg font-medium">Billing Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billingAddressLine1">Address Line 1</Label>
            <Input id="billingAddressLine1" name="billingAddressLine1" value={formData.billingAddressLine1} onChange={handleChange} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billingAddressLine2">Address Line 2</Label>
            <Input id="billingAddressLine2" name="billingAddressLine2" value={formData.billingAddressLine2} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingCity">City</Label>
            <Input id="billingCity" name="billingCity" value={formData.billingCity} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingState">State</Label>
            <Input id="billingState" name="billingState" value={formData.billingState} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingPincode">Pincode</Label>
            <Input id="billingPincode" name="billingPincode" value={formData.billingPincode} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingCountry">Country</Label>
            <Input id="billingCountry" name="billingCountry" value={formData.billingCountry} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/customers")} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
}
