"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
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
import { SalesOrder } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function OrderList() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const res = await api.get<SalesOrder[]>("/sales-orders");
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
  } = useDataTable<SalesOrder>({
    data: orders,
    searchFields: ["soNumber", "customerName"],
    filterFn: (so) => {
      if (statusFilter === "ALL") return true;
      return so.status?.toUpperCase() === statusFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Sales Orders
          <PageHelpTooltip
            title="Sales Orders"
            description="Manage confirmed customer orders, track delivery and fulfillment stages, and convert accepted orders into sales invoices."
          />
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/sales/orders/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Sales Order</Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search orders by SO number or customer..."
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
              <SelectItem value="CONFIRMED" className="text-xs">Confirmed</SelectItem>
              <SelectItem value="INVOICED" className="text-xs">Invoiced</SelectItem>
              <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading sales orders..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {searchTerm || statusFilter !== "ALL" ? "No sales orders matching your search filters." : "No sales orders found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((so: SalesOrder) => (
                <TableRow key={so.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{so.soNumber}</TableCell>
                  <TableCell>{so.orderDate}</TableCell>
                  <TableCell>{so.customerName}</TableCell>
                  <TableCell><Badge variant="outline">{so.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">₹{so.totalAmount?.toFixed(2)}</TableCell>
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
