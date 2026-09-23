"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Customer } from "@/types";
import { Loader2 } from "lucide-react";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
}: CreateCustomerDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    billingAddressLine1: "",
    billingCity: "",
    billingState: "",
    billingPincode: "",
    billingCountry: "India",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      gstin: "",
      billingAddressLine1: "",
      billingCity: "",
      billingState: "",
      billingPincode: "",
      billingCountry: "India",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post<Customer>("/customers", payload);
      return res;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Customer "${newCustomer.name}" created!`);
      onCustomerCreated(newCustomer);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create customer. Please check the details.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Add New Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name" className="text-slate-300">Customer Name *</Label>
              <Input
                id="customer-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Enterprises"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-phone" className="text-slate-300">Phone Number *</Label>
              <Input
                id="customer-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-email" className="text-slate-300">Email Address</Label>
              <Input
                id="customer-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@acme.com"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-gstin" className="text-slate-300">GSTIN</Label>
              <Input
                id="customer-gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="27AABCU9603R1ZM"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white uppercase"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Billing Address</h4>
            
            <div className="space-y-1.5">
              <Label htmlFor="customer-address" className="text-slate-300">Address Line 1</Label>
              <Input
                id="customer-address"
                name="billingAddressLine1"
                value={formData.billingAddressLine1}
                onChange={handleChange}
                placeholder="Street address, shop number, or building"
                className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customer-city" className="text-slate-300">City</Label>
                <Input
                  id="customer-city"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer-state" className="text-slate-300">State</Label>
                <Input
                  id="customer-state"
                  name="billingState"
                  value={formData.billingState}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer-pincode" className="text-slate-300">Pincode</Label>
                <Input
                  id="customer-pincode"
                  name="billingPincode"
                  value={formData.billingPincode}
                  onChange={handleChange}
                  placeholder="400001"
                  className="bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
