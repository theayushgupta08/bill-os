"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

interface PaymentRecord {
  id: string;
  paymentDate: string;
  paymentNumber: string;
  type: string;
  paymentMethod: string;
  amount: number;
  entityName?: string;
  paymentType?: string;
  referenceNumber?: string;
}

export function PaymentList() {
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", page],
    queryFn: async () => {
      const res = await api.get<PaymentRecord[]>("/payments");
      return res;
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <div className="flex items-center space-x-2">
          <Link href="/payments/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p: PaymentRecord) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.paymentNumber}</TableCell>
                <TableCell>{p.paymentDate}</TableCell>
                <TableCell>
                  <Badge variant="default" className={p.paymentType === 'RECEIPT' ? "bg-green-500" : "bg-red-500"}>
                    {p.paymentType}
                  </Badge>
                </TableCell>
                <TableCell>{p.referenceNumber || "-"}</TableCell>
                <TableCell className="text-right font-bold">₹{p.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
