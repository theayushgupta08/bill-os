"use client";

import { useState } from "react";
import Link from "next/link";
import { api, downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Filter } from "lucide-react";
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
import { PurchaseOrder } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function PurchaseOrderList() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: orders = [] as PurchaseOrder[], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get<PurchaseOrder[]>("/purchase-orders");
      return res;
    },
  });

  const getStatusBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'ISSUED': return <Badge className="bg-blue-500">Issued</Badge>;
      case 'BILLED': return <Badge className="bg-green-500">Billed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    paginatedData,
  } = useDataTable<PurchaseOrder>({
    data: orders,
    searchFields: ["poNumber", "supplierName"],
    filterFn: (po) => {
      if (statusFilter === "ALL") return true;
      return po.status?.toUpperCase() === statusFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Purchase Orders
          <PageHelpTooltip
            title="Purchase Orders"
            description="Issue formal purchase orders to suppliers to request inventory replenishment, track fulfillment status, and convert to bills upon receipt."
          />
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/purchases/orders/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create PO</Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search purchase orders by number or supplier..."
        hasActiveFilters={statusFilter !== "ALL" || !!searchTerm}
        onResetFilters={() => {
          setSearchTerm("");
          setStatusFilter("ALL");
        }}
      >
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9 bg-slate-950/70 border-border text-foreground text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-xl text-slate-200">
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
              <SelectItem value="ISSUED" className="text-xs">Issued</SelectItem>
              <SelectItem value="BILLED" className="text-xs">Billed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading purchase orders..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm || statusFilter !== "ALL" ? "No purchase orders matching your search filters." : "No purchase orders found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((po: PurchaseOrder) => (
                <TableRow key={po.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.orderDate}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell className="text-right font-medium">₹{po.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => downloadPdf(`/purchase-orders/${po.id}/pdf`, `PO-${po.poNumber}.pdf`)}>
                      PDF
                    </Button>
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
