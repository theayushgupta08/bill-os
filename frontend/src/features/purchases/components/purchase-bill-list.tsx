"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { PurchaseOrder } from "@/types";

interface PurchaseBill {
  id: string;
  billNumber: string;
  billDate: string;
  totalAmount: number;
  status: string;
  supplier?: { name: string };
  supplierName?: string;
}

export function PurchaseBillList() {
  const queryClient = useQueryClient();
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: bills = [] as PurchaseBill[], isLoading } = useQuery({
    queryKey: ["purchase-bills", page],
    queryFn: async () => {
      const res = await api.get<PurchaseBill[]>("/purchase-bills");
      return res;
    },
  });

  const payMutation = useMutation({
    mutationFn: (bill: PurchaseBill) => {
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
      return api.post("/payments/vouchers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-bills"] });
    },
    onError: (error) => {
      console.error("Failed to record payment", error);
      alert("Failed to record payment");
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'UNPAID': return <Badge variant="destructive">Unpaid</Badge>;
      case 'PARTIAL': return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'PAID': return <Badge className="bg-green-500">Paid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>;

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
            {bills.map((bill: PurchaseOrder) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.billNumber}</TableCell>
                <TableCell>{bill.billDate}</TableCell>
                <TableCell>{bill.supplierName}</TableCell>
                <TableCell>{getStatusBadge(bill.status)}</TableCell>
                <TableCell className="text-right">₹{bill.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {bill.status !== 'PAID' && (
                    <Button variant="outline" size="sm" onClick={() => payMutation.mutate(bill)} disabled={payMutation.isPending}>
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
               <TableRow><TableCell colSpan={6} className="text-center h-24">No purchase bills found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
