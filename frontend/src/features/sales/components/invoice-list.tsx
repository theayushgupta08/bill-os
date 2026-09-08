"use client";

import Link from "next/link";
import { api, downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { toast } from "sonner";
import { Invoice } from "@/types";

export function InvoiceList() {
  const queryClient = useQueryClient();
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices", page],
    queryFn: async () => {
      const res = await api.get<Invoice[]>("/sales-invoices");
      return res;
    },
  });

  const payMutation = useMutation({
    mutationFn: (inv: Invoice) => {
      const payload = {
        paymentDate: new Date().toISOString().split('T')[0],
        amount: inv.totalAmount,
        notes: "Auto-recorded full payment",
        allocations: [
          {
            salesInvoiceId: inv.id,
            allocatedAmount: inv.totalAmount
          }
        ]
      };
      return api.post("/payments/receipts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast.success("Payment recorded successfully!");
    },
    onError: (error) => {
      console.error("Failed to record payment", error);
      toast.error("Failed to record payment");
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Invoices</h2>
        <div className="flex items-center space-x-2">
          <Link href="/sales/invoices/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell><Badge variant="default" className={inv.status === 'PAID' ? "bg-green-500" : "bg-blue-500"}>{inv.status}</Badge></TableCell>
                <TableCell className="text-right">₹{inv.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(`/sales-invoices/${inv.id}/pdf`, `Invoice-${inv.invoiceNumber}.pdf`)}>
                    PDF
                  </Button>
                  {inv.status !== 'PAID' && (
                    <Button variant="outline" size="sm" onClick={() => payMutation.mutate(inv)} disabled={payMutation.isPending}>
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
               <TableRow><TableCell colSpan={6} className="text-center h-24">No sales invoices found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
