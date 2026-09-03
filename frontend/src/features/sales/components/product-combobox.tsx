"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDownIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  basePrice?: number;
  taxRate?: number;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ProductCombobox({ products, value, onChange, className }: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected product's name
  const selectedProduct = products.find(p => p.id === value);
  const displayValue = isOpen ? searchTerm : (selectedProduct?.name || "");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value) onChange(""); // Clear selection when typing a new search
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(selectedProduct?.name || "");
          }}
          placeholder="Search product..."
          className="w-full pr-10"
        />
        <ChevronDownIcon 
          className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground cursor-pointer pointer-events-none" 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="p-1">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === product.id ? "bg-accent text-accent-foreground" : ""
                  )}
                  onClick={() => {
                    onChange(product.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {value === product.id && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
