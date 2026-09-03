"use client";

import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Package, Inbox } from "lucide-react";

interface StockRecord {
  productName: string;
  sku?: string;
  warehouseName: string;
  quantity: number;
}

export function StockReport() {
  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const res = await api.get<StockRecord[]>(`/reports/stock-summary`);
      return res;
    }
  });

  const totalQuantity = stock.reduce((sum: number, item: StockRecord) => sum + (item.quantity || 0), 0);

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Stock Summary</h2>
          <p className="text-sm text-slate-400">Current available inventory quantities categorized by product warehouse locations.</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-indigo-950/20 border border-indigo-500/25 p-5 rounded-xl flex items-center justify-between shadow-lg max-w-md">
        <div>
          <h3 className="font-semibold text-base text-slate-300">Total Items in Stock</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sum of all warehouse quantities</p>
        </div>
        <div className="text-3xl font-extrabold text-indigo-400 font-mono tracking-tight">
          {totalQuantity.toLocaleString()}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Product Name</TableHead>
              <TableHead className="text-slate-400 font-semibold">SKU</TableHead>
              <TableHead className="text-slate-400 font-semibold">Warehouse</TableHead>
              <TableHead className="text-right pr-6 text-slate-400 font-semibold">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">Loading stock inventory...</TableCell>
              </TableRow>
            ) : stock.map((item: StockRecord, idx: number) => (
              <TableRow key={idx} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="font-semibold text-white pl-6 py-4">{item.productName}</TableCell>
                <TableCell className="text-slate-350 font-mono text-xs">{item.sku || "—"}</TableCell>
                <TableCell className="text-slate-300 text-sm">{item.warehouseName}</TableCell>
                <TableCell className={`text-right pr-6 font-mono text-sm font-semibold ${item.quantity <= 5 ? "text-rose-450" : "text-white"}`}>
                  {item.quantity.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && stock.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No stock entries registered.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
