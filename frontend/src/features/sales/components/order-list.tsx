"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
        <div className="flex items-center space-x-2">
          <Link href="/sales/orders/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Sales Order</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
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
              <TableRow key={so.id}>
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
