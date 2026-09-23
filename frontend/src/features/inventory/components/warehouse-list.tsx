"use client";

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
import { Plus, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/loader";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDataTable } from "@/hooks/use-data-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse } from "@/types";

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function WarehouseList() {
  const queryClient = useQueryClient();

  const { data: warehouses = [] as Warehouse[], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get<Warehouse[]>("/warehouses");
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => {
      console.error("Failed to delete warehouse", error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
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
  } = useDataTable<Warehouse>({
    data: warehouses,
    searchFields: ["name", "code", "city", "state"],
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Warehouses
          <PageHelpTooltip
            title="Warehouses & Locations"
            description="Manage physical and virtual storage locations, track stock distribution, and coordinate inter-warehouse inventory movements."
          />
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/warehouses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Warehouse
            </Button>
          </Link>
        </div>
      </div>

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search warehouses by name, code, city..."
      />
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading warehouses..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {searchTerm ? "No warehouses matching your search." : "No warehouses found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((warehouse: Warehouse) => (
                <TableRow key={warehouse.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.city || "-"}, {warehouse.state || "-"}</TableCell>
                  <TableCell>
                    {warehouse.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/warehouses/${warehouse.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(warehouse.id)} disabled={deleteMutation.isPending}>
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
