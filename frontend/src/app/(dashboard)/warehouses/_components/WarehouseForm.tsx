"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Warehouse } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface WarehouseFormProps {
  id?: string;
}

export function WarehouseForm({ id }: WarehouseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
  });

  useEffect(() => {
    const init = async () => {
      if (id) {
        try {
          const data = await api.get<Warehouse>(`/warehouses/${id}`);
          setFormData({
            name: data.name || "",
            code: data.code || "",
            addressLine1: data.addressLine1 || "",
            addressLine2: data.addressLine2 || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            isActive: data.isActive !== undefined ? data.isActive : true,
          });
        } catch (error) {
          console.error("Failed to load warehouse data", error);
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await api.put(`/warehouses/${id}`, formData);
      } else {
        await api.post("/warehouses", formData);
      }
      
      router.push("/warehouses");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to save warehouse", error);
      const err = error as AxiosError<{message: string}>;
      alert(err.response?.data?.message || "Failed to save warehouse. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (initialLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Warehouse Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g. Main Warehouse"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Warehouse Code</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. MAIN"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="isActive" 
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, isActive: checked as boolean }))
          }
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Warehouse"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/warehouses")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
