"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check, UserPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Customer } from "@/types";
import { CreateCustomerDialog } from "@/features/customers/components/create-customer-dialog";

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  className?: string;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  className,
}: CustomerComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === value);

  // Format: Customer Name (Phone Number)
  const formatCustomerLabel = (customer: Customer) => {
    if (customer.phone) {
      return `${customer.name} (${customer.phone})`;
    }
    return customer.name;
  };

  const displayValue = isOpen
    ? searchTerm
    : selectedCustomer
    ? formatCustomerLabel(selectedCustomer)
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

  // Top 5 recent customers (sorted by createdAt or reverse order)
  const recentCustomers = useMemo(() => {
    const list = [...customers];
    return list
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [customers]);

  // Filtered customers when user types
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer.id);
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
            if (value && e.target.value !== formatCustomerLabel(selectedCustomer!)) {
              onChange(""); // Clear selection when modifying search
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder="Select or search customer (Name or Phone)..."
          className="w-full pr-10 bg-slate-950/60 border-slate-800 text-white focus:border-indigo-500 transition-colors"
        />
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-transform duration-200 cursor-pointer pointer-events-none",
            isOpen && "rotate-180 text-indigo-400"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl backdrop-blur-md outline-none animate-in fade-in-0 zoom-in-95">
          {/* Quick Add Button Header */}
          <div className="p-1.5 border-b border-slate-800/80 bg-slate-950/40">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddCustomerOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors"
            >
              <UserPlus className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>+ Add New Customer</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-800/40">
            {searchTerm.trim() ? (
              // Search Results
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Matching Customers ({filteredCustomers.length})
                </div>
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No customers found for &quot;{searchTerm}&quot;.
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-xs outline-none hover:bg-slate-800 hover:text-white transition-colors",
                        value === customer.id ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-slate-300"
                      )}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      {value === customer.id && (
                        <span className="absolute left-2 flex h-4 w-4 items-center justify-center text-indigo-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{customer.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {customer.phone ? `Phone: ${customer.phone}` : "No phone"} {customer.gstin ? `• GSTIN: ${customer.gstin}` : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Recent 5 Customers
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Recent Customers
                </div>
                {recentCustomers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No customers registered yet.
                  </div>
                ) : (
                  recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-xs outline-none hover:bg-slate-800 hover:text-white transition-colors",
                        value === customer.id ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-slate-300"
                      )}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      {value === customer.id && (
                        <span className="absolute left-2 flex h-4 w-4 items-center justify-center text-indigo-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{customer.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {customer.phone ? `Phone: ${customer.phone}` : "No phone"} {customer.gstin ? `• GSTIN: ${customer.gstin}` : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Create Customer Dialog */}
      <CreateCustomerDialog
        open={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onCustomerCreated={(newCustomer) => {
          onChange(newCustomer.id);
        }}
      />
    </div>
  );
}
