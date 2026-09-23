"use client";


import { useFormat } from "@/lib/use-format";
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
import { Quotation } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function QuoteList() {
  const { formatMoney, formatDate } = useFormat();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const res = await api.get<Quotation[]>("/quotations");
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
  } = useDataTable<Quotation>({
    data: quotes,
    searchFields: ["quoteNumber", "customerName"],
    filterFn: (q) => {
      if (statusFilter === "ALL") return true;
      return q.status?.toUpperCase() === statusFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Quotations
          <PageHelpTooltip
            title="Sales Quotations"
            description="Create and send price estimates and commercial proposals to prospective clients before confirming an order."
          />
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/sales/quotes/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Quote</Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search quotes by number or customer..."
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
              <SelectItem value="SENT" className="text-xs">Sent</SelectItem>
              <SelectItem value="ACCEPTED" className="text-xs">Accepted</SelectItem>
              <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote Number</TableHead>
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
                  <BrandLoader variant="card" text="Loading quotations..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm || statusFilter !== "ALL" ? "No quotations matching your search filters." : "No quotations found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((q: Quotation) => (
                <TableRow key={q.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{q.quoteNumber}</TableCell>
                  <TableCell>{formatDate(q.quoteDate)}</TableCell>
                  <TableCell>{q.customerName}</TableCell>
                  <TableCell><Badge variant="outline">{q.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(q.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => downloadPdf(`/quotations/${q.id}/pdf`, `Quote-${q.quoteNumber}.pdf`)}>
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
