"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccountFormProps {
  id?: string;
}

export function AccountForm({ id }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [parentAccounts, setParentAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    accountCode: "",
    name: "",
    description: "",
    type: "ASSET",
    parentId: "",
    isActive: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const accounts = await fetchApi("/api/v1/accounts");
        setParentAccounts(accounts.filter((a: any) => a.id !== id)); // exclude self

        if (id) {
          const data = await fetchApi(`/api/v1/accounts/${id}`);
          setFormData({
            accountCode: data.accountCode || "",
            name: data.name || "",
            description: data.description || "",
            type: data.type || "ASSET",
            parentId: data.parentId || "",
            isActive: data.isActive !== undefined ? data.isActive : true,
          });
        }
      } catch (error) {
        console.error("Failed to load account data", error);
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
      };

      if (id) {
        await fetchApi(`/api/v1/accounts/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/api/v1/accounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      
      router.push("/accounts");
      router.refresh();
    } catch (error) {
      console.error("Failed to save account", error);
      alert("Failed to save account. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (initialLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountCode">Account Code *</Label>
          <Input
            id="accountCode"
            name="accountCode"
            value={formData.accountCode}
            onChange={handleChange}
            required
            placeholder="e.g. 1000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g. Cash"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Account Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASSET">Asset</SelectItem>
              <SelectItem value="LIABILITY">Liability</SelectItem>
              <SelectItem value="EQUITY">Equity</SelectItem>
              <SelectItem value="REVENUE">Revenue</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentId">Parent Account (Optional)</Label>
          <Select 
            value={formData.parentId} 
            onValueChange={(val) => setFormData(prev => ({ ...prev, parentId: val === "none" ? "" : val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- None --</SelectItem>
              {parentAccounts
                .filter(a => a.type === formData.type) // Parent should ideally be same type
                .map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.accountCode} - {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
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
          {loading ? "Saving..." : "Save Account"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/accounts")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
