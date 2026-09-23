"use client";


import { useFormat } from "@/lib/use-format";
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
import { Plus, Edit, Trash, Filter } from "lucide-react";
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

interface Account {
  id: string;
  accountCode: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
}

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function AccountList() {
  const { formatMoney } = useFormat();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const { data: accounts = [] as Account[], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("/accounts");
      return res as Account[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error) => {
      console.error("Failed to delete account", error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      deleteMutation.mutate(id);
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
  } = useDataTable<Account>({
    data: accounts,
    searchFields: ["accountCode", "name", "type"],
    filterFn: (acc) => {
      if (typeFilter === "ALL") return true;
      return acc.type?.toUpperCase() === typeFilter;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Chart of Accounts
          <PageHelpTooltip
            title="Chart of Accounts"
            description="View and manage the double-entry accounting ledger accounts categorizing assets, liabilities, equity, revenues, and expenses."
          />
        </h1>
        <Link href="/accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </Link>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search accounts by code, name, or type..."
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
              <SelectItem value="ASSET" className="text-xs">Asset</SelectItem>
              <SelectItem value="LIABILITY" className="text-xs">Liability</SelectItem>
              <SelectItem value="EQUITY" className="text-xs">Equity</SelectItem>
              <SelectItem value="REVENUE" className="text-xs">Revenue</SelectItem>
              <SelectItem value="EXPENSE" className="text-xs">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableToolbar>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading chart of accounts..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm || typeFilter !== "ALL" ? "No accounts matching your search filters." : "No accounts found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((account: Account) => (
                <TableRow key={account.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{account.accountCode}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(account.balance)}
                  </TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/accounts/${account.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(account.id)} disabled={deleteMutation.isPending}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
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
