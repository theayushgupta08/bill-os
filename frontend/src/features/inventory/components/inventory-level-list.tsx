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
import { BrandLoader } from "@/components/ui/loader";
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

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Stock Levels</h1>
        <Link href="/inventory/adjust">
          <Button>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Adjust Stock
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading stock levels..." size="lg" />
                </TableCell>
              </TableRow>
            ) : levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No stock data available.
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level: InventoryLevel) => (
                <TableRow key={level.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
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
