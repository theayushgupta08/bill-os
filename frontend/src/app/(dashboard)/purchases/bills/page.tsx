"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PurchaseBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data: any = await apiClient.get("/purchase-bills");
      setBills(data);
    } catch (error) {
      console.error("Failed to load Bills", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'UNPAID': return <Badge variant="destructive">Unpaid</Badge>;
      case 'PARTIAL': return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'PAID': return <Badge className="bg-green-500">Paid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  const handleRecordPayment = async (bill: any) => {
    setIsPaying(true);
    try {
      const payload = {
        paymentDate: new Date().toISOString().split('T')[0],
        amount: bill.totalAmount,
        notes: "Auto-recorded full payment to supplier",
        allocations: [
          {
            purchaseBillId: bill.id,
            allocatedAmount: bill.totalAmount
          }
        ]
      };

      await apiClient.post("/payments/vouchers", payload);
      await loadBills();
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
        <h2 className="text-3xl font-bold tracking-tight">Purchase Bills</h2>
        <div className="flex items-center space-x-2">
          <Link href="/purchases/bills/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Bill</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.billNumber}</TableCell>
                <TableCell>{bill.billDate}</TableCell>
                <TableCell>{bill.supplierName}</TableCell>
                <TableCell>{getStatusBadge(bill.status)}</TableCell>
                <TableCell className="text-right">${bill.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {bill.status !== 'PAID' && (
                    <Button variant="outline" size="sm" onClick={() => handleRecordPayment(bill)} disabled={isPaying}>
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
