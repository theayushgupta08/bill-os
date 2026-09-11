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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Invoice } from "@/types";

export function InvoiceList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      const res = await api.get<Invoice[]>("/sales-invoices");
      return res;
    },
  });

  const payMutation = useMutation({
    mutationFn: (inv: Invoice) => {
      const payload = {
        paymentDate: new Date().toISOString().split('T')[0],
        amount: inv.totalAmount,
        notes: "Auto-recorded full payment",
        allocations: [
          {
            salesInvoiceId: inv.id,
            allocatedAmount: inv.totalAmount
          }
        ]
      };
      return api.post("/payments/receipts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast.success("Payment recorded successfully!");
    },
    onError: (error) => {
      console.error("Failed to record payment", error);
      toast.error("Failed to record payment");
    }
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
  } = useDataTable<Invoice>({
    data: invoices,
    searchFields: ["invoiceNumber", "customerName"],
    filterFn: (inv) => {
      if (statusFilter === "ALL") return true;
      return inv.status?.toUpperCase() === statusFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Sales Invoices</h1>
        <div className="flex items-center space-x-2">
          <Link href="/sales/invoices/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search invoices by number or customer..."
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
              <SelectItem value="PAID" className="text-xs">Paid</SelectItem>
              <SelectItem value="UNPAID" className="text-xs">Unpaid</SelectItem>
              <SelectItem value="OVERDUE" className="text-xs">Overdue</SelectItem>
              <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading sales invoices..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm || statusFilter !== "ALL" ? "No invoices matching your search filters." : "No sales invoices found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((inv: Invoice) => (
                <TableRow key={inv.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.invoiceDate}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="default" className={inv.status === 'PAID' ? "bg-green-500" : "bg-blue-500"}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{inv.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => downloadPdf(`/sales-invoices/${inv.id}/pdf`, `Invoice-${inv.invoiceNumber}.pdf`)}>
                      PDF
                    </Button>
                    {inv.status !== 'PAID' && (
                      <Button variant="outline" size="sm" onClick={() => payMutation.mutate(inv)} disabled={payMutation.isPending}>
                        Record Payment
                      </Button>
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
