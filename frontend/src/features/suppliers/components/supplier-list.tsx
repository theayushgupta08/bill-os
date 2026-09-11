"use client";

import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDataTable } from "@/hooks/use-data-table";
import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@/types";

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function SupplierList() {
  const queryClient = useQueryClient();

  const { data: suppliers = [] as Supplier[], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await api.get<Supplier[]>("/suppliers");
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      console.error("Failed to delete supplier:", error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
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
  } = useDataTable<Supplier>({
    data: suppliers,
    searchFields: ["name", "email", "phone", "gstin"],
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Suppliers
          <PageHelpTooltip
            title="Supplier & Vendor Directory"
            description="Maintain vendor records, contact details, payment terms, purchasing history, and outstanding payables."
          />
        </h1>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </Link>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search suppliers by name, phone, email, GSTIN..."
      />

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading suppliers..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm ? "No suppliers matching your search." : "No suppliers found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((supplier: Supplier) => (
                <TableRow key={supplier.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.gstin || "-"}</TableCell>
                  <TableCell>₹{supplier.outstandingBalance?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/suppliers/${supplier.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(supplier.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
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
