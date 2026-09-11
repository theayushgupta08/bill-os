"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
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
import { ProductCategory } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
import { BulkImportDialog } from "@/components/common/bulk-import-dialog";

export function CategoryList() {
  const queryClient = useQueryClient();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data: categories = [] as ProductCategory[], isLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const res = await api.get<ProductCategory[]>("/product-categories");
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/product-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
    onError: (error) => {
      console.error("Failed to delete category:", error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
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
  } = useDataTable<ProductCategory>({
    data: categories,
    searchFields: ["name", "description"],
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Product Categories
          <PageHelpTooltip
            title="Product Categories"
            description="Organize your products into logical categories and subcategories for streamlined catalog navigation and sales reporting."
          />
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs"
          >
            <Upload className="mr-2 h-3.5 w-3.5 text-indigo-400" /> Import CSV/Excel
          </Button>
          <Link href="/product-categories/new">
            <Button className="text-xs">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Category
            </Button>
          </Link>
        </div>
      </div>

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entity="categories"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["product-categories"] });
        }}
      />

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search categories by name or description..."
      />

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading categories..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  {searchTerm ? "No categories matching your search." : "No categories found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((category: ProductCategory) => (
                <TableRow key={category.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/product-categories/${category.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(category.id)}
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
