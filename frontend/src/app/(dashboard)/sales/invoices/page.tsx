"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient, { downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data: any = await apiClient.get("/sales-invoices");
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (inv: any) => {
    setIsPaying(true);
    try {
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

      await apiClient.post("/payments/receipts", payload);
      await loadInvoices();
    } catch (error) {
      console.error("Failed to record payment", error);
      alert("Failed to record payment");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

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
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell><Badge variant="default" className={inv.status === 'PAID' ? "bg-green-500" : "bg-blue-500"}>{inv.status}</Badge></TableCell>
                <TableCell className="text-right">${inv.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(`/sales-invoices/${inv.id}/pdf`, `Invoice-${inv.invoiceNumber}.pdf`)}>
                    PDF
                  </Button>
                  {inv.status !== 'PAID' && (
                    <Button variant="outline" size="sm" onClick={() => handleRecordPayment(inv)} disabled={isPaying}>
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
