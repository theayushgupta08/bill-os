"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    gstin: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For now, we assume the backend will return the created org with its ID
      const response: any = await api.post("/organizations", formData);
      const orgId = response.data?.id || response.id;
      
      // Store the active organization ID in localStorage (or a Zustand store)
      localStorage.setItem("active_org_id", orgId);
      
      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create organization", error);
      // Handle error state here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to billOS!</CardTitle>
          <CardDescription>
            Let&apos;s set up your business profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Business Display Name</Label>
              <Input
                id="name"
                placeholder="e.g. Acme Corp"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="legalName">Legal Entity Name</Label>
              <Input
                id="legalName"
                placeholder="e.g. Acme Corporation Pvt. Ltd."
                value={formData.legalName}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                placeholder="29ABCDE1234F1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Setting up..." : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
