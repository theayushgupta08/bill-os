"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const orgId = localStorage.getItem("active_org_id");
    if (orgId) {
      loadOrganization(orgId);
    }
  }, []);

  const loadOrganization = async (id: string) => {
    try {
      setLoading(true);
      const data: any = await apiClient.get(`/organizations/${id}`);
      setOrg(data);
      setFormData({
        name: data.name || "",
        legalName: data.legalName || "",
        gstin: data.gstin || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = localStorage.getItem("active_org_id");
    if (!orgId) return;

    try {
      setSaving(true);
      await apiClient.put(`/organizations/${orgId}`, formData);
      toast.success("Organization details updated successfully");
      loadOrganization(orgId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!org) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organization Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your organization's general information.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Legal Entity Name</label>
            <Input name="legalName" value={formData.legalName} onChange={handleChange} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">GSTIN</label>
            <Input name="gstin" value={formData.gstin} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input name="phone" value={formData.phone} onChange={handleChange} />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Address Line 1</label>
          <Input name="address" value={formData.address} onChange={handleChange} />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input name="city" value={formData.city} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State</label>
            <Input name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pincode</label>
            <Input name="pincode" value={formData.pincode} onChange={handleChange} />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
