"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function PaymentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    paymentType: "RECEIPT", // RECEIPT or PAYMENT
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    referenceNumber: "",
    notes: "",
    allocatedDocumentId: "", // ID of Sales Invoice or Purchase Bill
  });

  const { data: invoices = [] as any[], isLoading: loadingInvoices } = useQuery({
    queryKey: ["sales-invoices-unpaid"],
    queryFn: async () => {
      const res = await api.get<any>("/sales-invoices");
      return (res as any[]).filter((i: any) => i.status !== 'PAID');
    }
  });

  const { data: bills = [] as any[], isLoading: loadingBills } = useQuery({
    queryKey: ["purchase-bills-unpaid"],
    queryFn: async () => {
      const res = await api.get<any>("/purchase-bills");
      return (res as any[]).filter((b: any) => b.status !== 'PAID');
    }
  });

  const initialLoading = loadingInvoices || loadingBills;

  const handleDocumentChange = (docId: any) => {
    setFormData(prev => ({ ...prev, allocatedDocumentId: docId }));
    
    if (formData.paymentType === "RECEIPT") {
      const inv = invoices.find((i: any) => i.id === docId);
      if (inv) {
        setFormData(prev => ({ ...prev, amount: inv.totalAmount.toString() }));
      }
    } else {
      const bill = bills.find((b: any) => b.id === docId);
      if (bill) {
        setFormData(prev => ({ ...prev, amount: bill.totalAmount.toString() }));
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      const endpoint = formData.paymentType === "RECEIPT" ? "/payments/receipts" : "/payments/vouchers";
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-bills"] });
      router.push("/payments");
      router.refresh();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || "Failed to record payment");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const payload = {
      paymentDate: formData.paymentDate,
      amount: Number(formData.amount),
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
      allocations: [] as any[]
    };

    if (formData.allocatedDocumentId) {
      if (formData.paymentType === "RECEIPT") {
        payload.allocations.push({
          salesInvoiceId: formData.allocatedDocumentId,
          allocatedAmount: Number(formData.amount)
        });
      } else {
        payload.allocations.push({
          purchaseBillId: formData.allocatedDocumentId,
          allocatedAmount: Number(formData.amount)
        });
      }
    }

    createMutation.mutate(payload);
  };

  if (initialLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-2">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Record Payment</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select 
                value={formData.paymentType} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, paymentType: val, allocatedDocumentId: "", amount: "" }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">Receipt (Money In)</SelectItem>
                  <SelectItem value="PAYMENT">Payment Voucher (Money Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allocate to {formData.paymentType === "RECEIPT" ? "Sales Invoice" : "Purchase Bill"}</Label>
              <Select 
                value={formData.allocatedDocumentId} 
                onValueChange={handleDocumentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${formData.paymentType === "RECEIPT" ? "invoice" : "bill"} to allocate`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific document</SelectItem>
                  {formData.paymentType === "RECEIPT" 
                    ? invoices.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.invoiceNumber} - {i.customerName} (₹{i.totalAmount})
                        </SelectItem>
                      ))
                    : bills.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.billNumber} - {b.supplierName} (₹{b.totalAmount})
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Number (e.g., Check #, UPI ID)</Label>
              <Input
                value={formData.referenceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Link href="/payments">
            <Button type="button" variant="outline" disabled={createMutation.isPending}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
