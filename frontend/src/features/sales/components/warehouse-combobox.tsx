"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check, Warehouse as WarehouseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Warehouse } from "@/types";

interface WarehouseComboboxProps {
  warehouses: Warehouse[];
  value: string;
  onChange: (warehouseId: string) => void;
  className?: string;
  placeholder?: string;
}

export function WarehouseCombobox({
  warehouses,
  value,
  onChange,
  className,
  placeholder = "Select warehouse...",
}: WarehouseComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected warehouse
  const selectedWarehouse = warehouses.find((w) => w.id === value);
  const displayValue = isOpen
    ? searchTerm
    : selectedWarehouse
    ? selectedWarehouse.name
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

  // Autopopulate primary/default warehouse if empty
  useEffect(() => {
    if (!value && warehouses.length > 0) {
      const defaultWh =
        warehouses.find(
          (w) => w.code === "MAIN" || w.name?.toLowerCase().includes("main")
        ) || warehouses[0];
      if (defaultWh) {
        onChange(defaultWh.id);
      }
    }
  }, [value, warehouses, onChange]);

  const filteredWarehouses = useMemo(() => {
    if (!searchTerm.trim()) return warehouses;
    const q = searchTerm.toLowerCase();
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.city && w.city.toLowerCase().includes(q))
    );
  }, [warehouses, searchTerm]);

  const handleSelect = (warehouse: Warehouse) => {
    onChange(warehouse.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value && e.target.value !== selectedWarehouse?.name) {
              onChange(""); // Clear selection on edit
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={placeholder}
          className="w-full pr-8 text-xs bg-slate-950/60 border-slate-800 text-white focus:border-indigo-500 transition-colors"
        />
        <ChevronDown
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-transform duration-200 cursor-pointer pointer-events-none",
            isOpen && "rotate-180 text-indigo-400"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[200px] overflow-hidden rounded-md border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl backdrop-blur-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredWarehouses.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No warehouses found.
              </div>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none hover:bg-slate-800 hover:text-white transition-colors",
                    value === warehouse.id ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-slate-300"
                  )}
                  onClick={() => handleSelect(warehouse)}
                >
                  {value === warehouse.id && (
                    <span className="absolute left-1.5 flex h-4 w-4 items-center justify-center text-indigo-400">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium text-white">{warehouse.name}</span>
                  </div>
                  {warehouse.code && (
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                      {warehouse.code}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
