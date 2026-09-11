"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { SalesOrder } from "@/types";

export function OrderList() {
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sales-orders", page],
    queryFn: async () => {
      const res = await api.get<SalesOrder[]>("/sales-orders");
      return res;
    },
  });

  if (isLoading) return <PageLoader text="Loading sales orders..." />;

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Sales Orders</h1>
        <div className="flex items-center space-x-2">
          <Link href="/sales/orders/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Sales Order</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((so: any) => (
              <TableRow key={so.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium">{so.soNumber}</TableCell>
                <TableCell>{so.orderDate}</TableCell>
                <TableCell>{so.customerName}</TableCell>
                <TableCell><Badge variant="outline">{so.status}</Badge></TableCell>
                <TableCell className="text-right">₹{so.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
               <TableRow><TableCell colSpan={5} className="text-center h-24">No sales orders found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
