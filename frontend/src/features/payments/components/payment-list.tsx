"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/loader";
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

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Payments</h1>
        <Link href="/payments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
        </Link>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading payments..." size="lg" />
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p: PaymentRecord) => (
                <TableRow key={p.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
