"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

interface InventoryLevel {
  id: string;
  productName: string;
  sku?: string;
  productCode?: string;
  warehouseName: string;
  quantity: number;
  minQuantity?: number;
}

export function InventoryLevelList() {
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["inventory-levels", page],
    queryFn: async () => {
      const res = await api.get<InventoryLevel[]>("/inventory/levels");
      return res;
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stock Levels</h2>
        <div className="flex items-center space-x-2">
          <Link href="/inventory/adjust">
            <Button>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Adjust Stock
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU/Code</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No stock data available.
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level: InventoryLevel) => (
                <TableRow key={level.id}>
                  <TableCell className="font-medium">{level.productName}</TableCell>
                  <TableCell>{level.productCode || "-"}</TableCell>
                  <TableCell>{level.warehouseName}</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {level.quantity}
                  </TableCell>
                  <TableCell>
                    {level.quantity > 0 ? (
                      <Badge className="bg-green-500">In Stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
