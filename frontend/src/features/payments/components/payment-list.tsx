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

interface PaymentRecord {
  id: string;
  paymentDate: string;
  paymentNumber: string;
  type: string;
  paymentMethod: string;
  amount: number;
  entityName?: string;
  paymentType?: string;
  referenceNumber?: string;
}

export function PaymentList() {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const { data: payments = [] as PaymentRecord[], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get<PaymentRecord[]>("/payments");
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
  } = useDataTable<PaymentRecord>({
    data: payments,
    searchFields: ["paymentNumber", "referenceNumber", "entityName", "paymentMethod"],
    filterFn: (p) => {
      if (typeFilter === "ALL") return true;
      return (p.paymentType || p.type)?.toUpperCase() === typeFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Payments</h1>
        <Link href="/payments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
        </Link>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search payments by number, reference, or party..."
        hasActiveFilters={typeFilter !== "ALL" || !!searchTerm}
        onResetFilters={() => {
          setSearchTerm("");
          setTypeFilter("ALL");
        }}
      >
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "ALL"); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9 bg-slate-950/70 border-border text-foreground text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-xl text-slate-200">
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="RECEIPT" className="text-xs">Receipts (Inflow)</SelectItem>
              <SelectItem value="PAYMENT" className="text-xs">Payments (Outflow)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading payments..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {searchTerm || typeFilter !== "ALL" ? "No payments matching your search filters." : "No payments found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((p: PaymentRecord) => (
                <TableRow key={p.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{p.paymentNumber}</TableCell>
                  <TableCell>{p.paymentDate}</TableCell>
                  <TableCell>
                    <Badge variant="default" className={(p.paymentType || p.type) === 'RECEIPT' ? "bg-green-500" : "bg-red-500"}>
                      {p.paymentType || p.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.referenceNumber || "-"}</TableCell>
                  <TableCell className="text-right font-bold">₹{p.amount.toFixed(2)}</TableCell>
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
