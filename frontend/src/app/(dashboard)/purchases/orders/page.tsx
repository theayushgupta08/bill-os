"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchApi("/api/v1/purchase-orders");
      setOrders(data);
    } catch (error) {
      console.error("Failed to load POs", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'ISSUED': return <Badge className="bg-blue-500">Issued</Badge>;
      case 'BILLED': return <Badge className="bg-green-500">Billed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <div className="flex items-center space-x-2">
          <Link href="/purchases/orders/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create PO</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell>{po.orderDate}</TableCell>
                <TableCell>{po.supplierName}</TableCell>
                <TableCell>{getStatusBadge(po.status)}</TableCell>
                <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(`/purchase-orders/${po.id}/pdf`, `PO-${po.poNumber}.pdf`)}>
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
