"use client";

import { useFormat } from "@/lib/use-format";

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
import { Product } from "@/types";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
import { BulkImportDialog } from "@/components/common/bulk-import-dialog";

export function ProductList() {
  const { formatMoney } = useFormat();
  const queryClient = useQueryClient();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data: products = [] as Product[], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get<Product[]>("/products");
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
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
  } = useDataTable<Product>({
    data: products,
    searchFields: ["name", "sku", "description"],
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Products
          <PageHelpTooltip
            title="Product Catalog"
            description="Maintain your master catalog of sellable items, SKUs, pricing, GST rates, HSN codes, and inventory valuation."
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
          <Link href="/products/new">
            <Button className="text-xs">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entity="products"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />

      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search products by name, SKU..."
      />

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead title="Weighted average purchase cost, updated from purchase bills">Avg. Cost</TableHead>
              <TableHead>Tax Rate (%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading products..." size="lg" />
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm ? "No products matching your search." : "No products found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((product: Product) => (
                <TableRow key={product.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>{formatMoney(product.basePrice)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.costPrice ? formatMoney(product.costPrice) : "—"}
                  </TableCell>
                  <TableCell>{product.taxRate}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(product.id)}
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
