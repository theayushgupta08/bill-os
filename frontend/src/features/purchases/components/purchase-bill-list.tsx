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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PurchaseBill, balanceDue } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function PurchaseBillList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: bills = [] as PurchaseBill[], isLoading } = useQuery({
    queryKey: ["purchase-bills"],
    queryFn: async () => {
      const res = await api.get<PurchaseBill[]>("/purchase-bills");
      return res;
    },
  });

  const payMutation = useMutation({
    mutationFn: (bill: PurchaseBill) => {
      // Settle only what is still owed — a partly-paid bill must not be paid its full total again
      const due = balanceDue(bill);
      const payload = {
        paymentDate: new Date().toISOString().split('T')[0],
        amount: due,
        notes: "Recorded balance payment to supplier",
        allocations: [{ purchaseBillId: bill.id, allocatedAmount: due }],
      };
      return api.post("/payments/vouchers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Payment recorded successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record payment");
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'UNPAID': return <Badge variant="destructive">Unpaid</Badge>;
      case 'PARTIAL': return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'PAID': return <Badge className="bg-green-500">Paid</Badge>;
      case 'VOID': return <Badge variant="outline">Void</Badge>;
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
  } = useDataTable<PurchaseBill>({
    data: bills,
    searchFields: [
      "billNumber",
      "supplierName",
    ],
    filterFn: (b) => {
      if (statusFilter === "ALL") return true;
      return b.status?.toUpperCase() === statusFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Purchase Bills
          <PageHelpTooltip
            title="Purchase Bills"
            description="Record and track vendor bills for goods and services received, manage payment due dates, and monitor accounts payable."
          />
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/purchases/bills/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Bill</Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search bills by number or supplier..."
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
              <SelectItem value="PARTIAL" className="text-xs">Partial</SelectItem>
              <SelectItem value="UNPAID" className="text-xs">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
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
                  <BrandLoader variant="card" text="Loading purchase bills..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm || statusFilter !== "ALL" ? "No bills matching your search filters." : "No purchase bills found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((bill: PurchaseBill) => (
                <TableRow key={bill.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.billDate}</TableCell>
                  <TableCell>{bill.supplierName || "-"}</TableCell>
                  <TableCell>{getStatusBadge(bill.status)}</TableCell>
                  <TableCell className="text-right font-medium">₹{bill.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {(bill.status === 'UNPAID' || bill.status === 'PARTIAL') && (
                      <Button variant="outline" size="sm" onClick={() => payMutation.mutate(bill)} disabled={payMutation.isPending}>
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
