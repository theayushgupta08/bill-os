"use client";

import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

export function StockReport() {
  const { data: stock = [] as any[], isLoading } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const res = await api.get<any>(`/reports/stock-summary`);
      return res;
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stock Summary</h2>
      </div>

      <div className="rounded-md border bg-white mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : stock.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.warehouseName}</TableCell>
                <TableCell className="text-right font-bold">{item.quantity}</TableCell>
              </TableRow>
            ))}
            {!isLoading && stock.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No stock found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
