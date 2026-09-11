"use client";

import { useState } from "react";
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
import { ArrowRightLeft, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/loader";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataTable } from "@/hooks/use-data-table";
import { useQuery } from "@tanstack/react-query";

interface InventoryLevel {
  id: string;
  productName: string;
  sku?: string;
  productCode?: string;
  warehouseName: string;
  quantity: number;
  minQuantity?: number;
}

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function InventoryLevelList() {
  const [stockFilter, setStockFilter] = useState<string>("ALL");

  const { data: levels = [] as InventoryLevel[], isLoading } = useQuery({
    queryKey: ["inventory-levels"],
    queryFn: async () => {
      const res = await api.get<InventoryLevel[]>("/inventory/levels");
      return res;
    },
  });

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    paginatedData,
  } = useDataTable<InventoryLevel>({
    data: levels,
    searchFields: ["productName", "sku", "productCode", "warehouseName"],
    filterFn: (lvl) => {
      if (stockFilter === "IN_STOCK") return lvl.quantity > 0;
      if (stockFilter === "OUT_OF_STOCK") return lvl.quantity <= 0;
      return true;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Stock Levels
          <PageHelpTooltip
            title="Inventory & Stock Levels"
            description="Monitor real-time on-hand inventory levels across warehouses, track low-stock thresholds, and view current stock status."
          />
        </h1>
        <Link href="/inventory/adjust">
          <Button>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Adjust Stock
          </Button>
        </Link>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search stock by product, SKU, or warehouse..."
        hasActiveFilters={stockFilter !== "ALL" || !!searchTerm}
        onResetFilters={() => {
          setSearchTerm("");
          setStockFilter("ALL");
        }}
      >
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v ?? "ALL"); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9 bg-slate-950/70 border-border text-foreground text-xs">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-xl text-slate-200">
              <SelectItem value="ALL" className="text-xs">All Stock</SelectItem>
              <SelectItem value="IN_STOCK" className="text-xs">In Stock (&gt; 0)</SelectItem>
              <SelectItem value="OUT_OF_STOCK" className="text-xs">Out of Stock (0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
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
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {searchTerm || stockFilter !== "ALL" ? "No stock items matching your search filters." : "No stock data available."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((level: InventoryLevel) => (
                <TableRow key={level.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{level.productName}</TableCell>
                  <TableCell>{level.sku || level.productCode || "-"}</TableCell>
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

        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
