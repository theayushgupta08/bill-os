"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch } from "lucide-react";
import { api, errorMessage } from "@/lib/api-client";
import { toast } from "sonner";
import { Organization, switchActiveOrganization } from "@/lib/use-organization";
import { useQueryClient } from "@tanstack/react-query";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentOrg: Organization;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
  parentOrg,
}: CreateBranchDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchToNewBranch, setSwitchToNewBranch] = useState(true);

  const [form, setForm] = useState({
    name: "",
    branchCode: "",
    gstin: "",
    phone: parentOrg?.phone || "+91 ",
    email: parentOrg?.email || "",
    addressLine1: "",
    city: "",
    state: parentOrg?.state || "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please provide a name for this branch or subsidiary.");
      return;
    }

    if (!form.phone.trim() || !form.phone.startsWith("+")) {
      toast.error("Phone must include country code, e.g. +91 9876543210");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.post<Organization>(
        `/organizations/${parentOrg.id}/branches`,
        {
          name: form.name.trim(),
          branchCode: form.branchCode.trim().toUpperCase() || undefined,
          gstin: form.gstin.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          addressLine1: form.addressLine1.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
        }
      );

      toast.success(`${created.name} created and linked to ${parentOrg.name}!`);

      queryClient.invalidateQueries({ queryKey: ["my-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-tree"] });

      onOpenChange(false);

      if (switchToNewBranch && created.id) {
        switchActiveOrganization(created.id);
      }
    } catch (err: unknown) {
      toast.error(errorMessage(err, "An error occurred while creating branch."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-indigo-400 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-indigo-400" />
            </div>
            <DialogTitle className="text-lg font-semibold text-white">
              Create New Branch / Subsidiary
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            Link a regional store, warehouse, or secondary entity under your Primary Parent Organization.
          </DialogDescription>
        </DialogHeader>

        {/* Parent Org Info Box */}
        <div className="rounded-lg bg-slate-950/70 border border-indigo-500/20 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {parentOrg?.name || "Headquarters"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Primary Master
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Master product prices, customer directory, and QR payment routing will be shared automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-slate-300">
                Branch / Entity Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. NCM Pune Retail Store"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Branch Code</Label>
              <Input
                name="branchCode"
                value={form.branchCode}
                onChange={handleChange}
                placeholder="e.g. PUNE-01"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Branch GSTIN (Optional)</Label>
              <Input
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                placeholder="e.g. 27BBBBB1111B2Z6"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">
                Contact Phone <span className="text-rose-400">*</span>
              </Label>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Email Address</Label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="branch@example.com"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-slate-300">Address Line</Label>
              <Input
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="Street address or commercial unit"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">City</Label>
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Pune"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">State</Label>
              <Input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={switchToNewBranch}
              onChange={(e) => setSwitchToNewBranch(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950/60 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-300">
              Switch to this branch immediately after creation
            </span>
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? "Creating Branch..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
