"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
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
import { Invoice, PurchaseBill, balanceDue } from "@/types";
import { PageLoader } from "@/components/ui/loader";

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

  // Only documents the backend will accept a payment against (see PaymentService.processPayment)
  const { data: invoices = [] as Invoice[], isLoading: loadingInvoices } = useQuery({
    queryKey: ["sales-invoices-unpaid"],
    queryFn: async () => {
      const res = await api.get<Invoice[]>("/sales-invoices");
      return res.filter((i) => i.status === "ISSUED" || i.status === "PARTIAL");
    }
  });

  const { data: bills = [] as PurchaseBill[], isLoading: loadingBills } = useQuery({
    queryKey: ["purchase-bills-unpaid"],
    queryFn: async () => {
      const res = await api.get<PurchaseBill[]>("/purchase-bills");
      return res.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL");
    }
  });

  const initialLoading = loadingInvoices || loadingBills;

  const handleDocumentChange = (docId: string | null) => {
    if (!docId) return;
    // "none" is the "No specific document" option — it must not be sent as a document id
    setFormData(prev => ({ ...prev, allocatedDocumentId: docId === "none" ? "" : docId }));

    const doc = formData.paymentType === "RECEIPT"
      ? invoices.find((i) => i.id === docId)
      : bills.find((b) => b.id === docId);
    if (doc) {
      setFormData(prev => ({ ...prev, amount: balanceDue(doc).toString() }));
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => {
      const endpoint = formData.paymentType === "RECEIPT" ? "/payments/receipts" : "/payments/vouchers";
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-bills"] });
      toast.success("Payment recorded successfully!");
      router.push("/payments");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record payment");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const payload = {
      paymentDate: formData.paymentDate,
      amount: Number(formData.amount),
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
      allocations: [] as unknown[]
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

  if (initialLoading) return <PageLoader text="Loading payment details..." showBrandText />;

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
                onValueChange={(val: string | null) => val && setFormData(prev => ({ ...prev, paymentType: val, allocatedDocumentId: "", amount: "" }))}
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
                value={formData.allocatedDocumentId || "none"}
                onValueChange={handleDocumentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${formData.paymentType === "RECEIPT" ? "invoice" : "bill"} to allocate`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific document</SelectItem>
                  {formData.paymentType === "RECEIPT" 
                    ? invoices.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.invoiceNumber} - {i.customerName} (₹{balanceDue(i)} due)
                        </SelectItem>
                      ))
                    : bills.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.billNumber} - {b.supplierName} (₹{balanceDue(b)} due)
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
