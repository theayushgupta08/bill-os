"use client";

import { useFormat } from "@/lib/use-format";
import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check, PackagePlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

import { CreateProductDialog } from "@/features/products/components/create-product-dialog";

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (value: string, product?: Product) => void;
  className?: string;
}

export function ProductCombobox({
  products,
  value,
  onChange,
  className,
}: ProductComboboxProps) {
  const { formatMoney } = useFormat();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected product
  const selectedProduct = products.find((p) => p.id === value);
  const displayValue = isOpen
    ? searchTerm
    : selectedProduct
    ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ""}`
    : "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Top 5 recent products (sorted by createdAt descending or reverse list)
  const recentProducts = useMemo(() => {
    const list = [...products];
    return list
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [products]);

  // Filtered products when typing search query
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.hsnSac && p.hsnSac.toLowerCase().includes(q))
    );
  }, [products, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    onChange(product.id, product);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", isOpen ? "z-50" : "z-auto", className)}>
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value && e.target.value !== selectedProduct?.name) {
              onChange(""); // Clear selection when typing new search
            }
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          onFocus={() => {
            if (!isOpen) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          placeholder="Search product..."
          className="w-full pr-8 text-xs bg-slate-950/60 border-slate-800 text-white focus:border-indigo-500 transition-colors cursor-text"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
            if (!isOpen) setSearchTerm("");
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
          title={isOpen ? "Close dropdown" : "Open dropdown"}
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180 text-indigo-400"
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-[100] mt-1 max-h-72 w-full min-w-[280px] overflow-hidden rounded-md border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl backdrop-blur-md outline-none animate-in fade-in-0 zoom-in-95">
          {/* Quick Add Product Button */}
          <div className="p-1.5 border-b border-slate-800/80 bg-slate-950/40">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddProductOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors"
            >
              <PackagePlus className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>+ Add New Product</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-800/40">
            {searchTerm.trim() ? (
              // Search Results
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Matching Products ({filteredProducts.length})
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No products found for &quot;{searchTerm}&quot;.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-slate-800 hover:text-white transition-colors",
                        value === product.id ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-slate-300"
                      )}
                      onClick={() => handleSelectProduct(product)}
                    >
                      {value === product.id && (
                        <span className="absolute left-1.5 flex h-4 w-4 items-center justify-center text-indigo-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="flex flex-col pr-2">
                        <span className="font-medium text-white">{product.name}</span>
                        {product.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400 shrink-0">
                        {formatMoney((Number(product.price ?? product.basePrice) || 0))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Recent 5 Products
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Recent Products
                </div>
                {recentProducts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No products available.
                  </div>
                ) : (
                  recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-slate-800 hover:text-white transition-colors",
                        value === product.id ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-slate-300"
                      )}
                      onClick={() => handleSelectProduct(product)}
                    >
                      {value === product.id && (
                        <span className="absolute left-1.5 flex h-4 w-4 items-center justify-center text-indigo-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="flex flex-col pr-2">
                        <span className="font-medium text-white">{product.name}</span>
                        {product.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400 shrink-0">
                        {formatMoney((Number(product.price ?? product.basePrice) || 0))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Create Product Dialog */}
      <CreateProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onProductCreated={(newProduct) => {
          handleSelectProduct(newProduct);
        }}
      />
    </div>
  );
}
