"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLoader } from "@/components/ui/loader";

interface Account {
  id: string;
  accountCode: string;
  name: string;
  description?: string;
  type: string;
  balance?: number;
  isActive?: boolean;
  parentId?: string;
}

interface AccountFormProps {
  id?: string;
}

export function AccountForm({ id }: AccountFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  
  const [formData, setFormData] = useState({
    accountCode: "",
    name: "",
    description: "",
    type: "ASSET",
    parentId: "",
    isActive: true,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get<Account[]>("/accounts");
      return res;
    }
  });

  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ["account", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<Account>(`/accounts/${id}`);
      return res;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (accountsData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParentAccounts(accountsData.filter((a: Account) => a.id !== id));
    }
  }, [accountsData, id]);

  useEffect(() => {
    if (accountData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        accountCode: accountData.accountCode || "",
        name: accountData.name || "",
        description: accountData.description || "",
        type: accountData.type || "ASSET",
        parentId: accountData.parentId || "",
        isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      });
    }
  }, [accountData]);

  const mutation = useMutation({
    mutationFn: (payload: unknown) => {
      if (id) {
        return api.put(`/accounts/${id}`, payload);
      }
      return api.post("/accounts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", id] });
      toast.success(id ? "Account updated successfully!" : "Account created successfully!");
      router.push("/accounts");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to save account", error);
      toast.error("Failed to save account. Please check details.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: formData.parentId || null,
    };
    mutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (id && isLoadingAccount) return <PageLoader text="Loading account details..." showBrandText />;

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
            onValueChange={(val: string | null) => val && setFormData(prev => ({ ...prev, type: val }))}
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
            onValueChange={(val: string | null) => val && setFormData(prev => ({ ...prev, parentId: val === "none" ? "" : val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- None --</SelectItem>
              {parentAccounts
                .filter((a: Account) => a.type === formData.type) // Parent should ideally be same type
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
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Account"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/accounts")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
