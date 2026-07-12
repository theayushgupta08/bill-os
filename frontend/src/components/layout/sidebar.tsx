"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Package2,
  Home,
  ShoppingCart,
  Users,
  LineChart,
  BookOpen,
  Receipt,
  FolderTree,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  
  const getLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
      isActive 
        ? "bg-muted text-primary" 
        : "text-muted-foreground hover:text-primary"
    }`;
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">billOS</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href="/dashboard"
              className={getLinkClass("/dashboard", true)}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/invoices"
              className={getLinkClass("/invoices")}
            >
              <ShoppingCart className="h-4 w-4" />
              Invoices
            </Link>
            <Link
              href="/customers"
              className={getLinkClass("/customers")}
            >
              <Users className="h-4 w-4" />
              Customers
            </Link>
            <Link
              href="/suppliers"
              className={getLinkClass("/suppliers")}
            >
              <Users className="h-4 w-4" />
              Suppliers
            </Link>
            <Link
              href="/products"
              className={getLinkClass("/products")}
            >
              <Package2 className="h-4 w-4" />
              Products
            </Link>
            <Link
              href="/product-categories"
              className={getLinkClass("/product-categories")}
            >
              <FolderTree className="h-4 w-4" />
              Categories
            </Link>
            <Link
              href="/warehouses"
              className={getLinkClass("/warehouses")}
            >
              <Building2 className="h-4 w-4" />
              Warehouses
            </Link>
            <Link
              href="/sales/quotes"
              className={getLinkClass("/sales/quotes")}
            >
              <FileText className="h-4 w-4" />
              Quotations
            </Link>
            <Link
              href="/sales/orders"
              className={getLinkClass("/sales/orders")}
            >
              <FileText className="h-4 w-4" />
              Sales Orders
            </Link>
            <Link
              href="/sales/invoices"
              className={getLinkClass("/sales/invoices")}
            >
              <Receipt className="h-4 w-4" />
              Sales Invoices
            </Link>
            <Link
              href="/purchases/orders"
              className={getLinkClass("/purchases/orders")}
            >
              <FileText className="h-4 w-4" />
              Purchase Orders
            </Link>
            <Link
              href="/purchases/bills"
              className={getLinkClass("/purchases/bills")}
            >
              <Receipt className="h-4 w-4" />
              Purchase Bills
            </Link>
            <Link
              href="/payments"
              className={getLinkClass("/payments")}
            >
              <Receipt className="h-4 w-4" />
              Payments
            </Link>
            <Link
              href="/inventory"
              className={getLinkClass("/inventory")}
            >
              <Package2 className="h-4 w-4" />
              Inventory
            </Link>
            <Link
              href="/accounts"
              className={getLinkClass("/accounts")}
            >
              <BookOpen className="h-4 w-4" />
              Chart of Accounts
            </Link>
            <Link
              href="/journal-entries"
              className={getLinkClass("/journal-entries")}
            >
              <Receipt className="h-4 w-4" />
              Journal Entries
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
              Reports
            </div>
            <Link
              href="/reports/sales"
              className={getLinkClass("/reports/sales")}
            >
              <LineChart className="h-4 w-4" />
              Sales Register
            </Link>
            <Link
              href="/reports/purchases"
              className={getLinkClass("/reports/purchases")}
            >
              <LineChart className="h-4 w-4" />
              Purchase Register
            </Link>
            <Link
              href="/reports/stock"
              className={getLinkClass("/reports/stock")}
            >
              <LineChart className="h-4 w-4" />
              Stock Summary
            </Link>
            <Link
              href="/reports/pnl"
              className={getLinkClass("/reports/pnl")}
            >
              <LineChart className="h-4 w-4" />
              Profit & Loss
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
              GST Reports
            </div>
            <Link
              href="/reports/gstr1"
              className={getLinkClass("/reports/gstr1")}
            >
              <LineChart className="h-4 w-4" />
              GSTR-1 (Outward)
            </Link>
            <Link
              href="/reports/gstr3b"
              className={getLinkClass("/reports/gstr3b")}
            >
              <LineChart className="h-4 w-4" />
              GSTR-3B (Summary)
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
              Outstanding
            </div>
            <Link
              href="/reports/outstanding/receivables"
              className={getLinkClass("/reports/outstanding/receivables")}
            >
              <LineChart className="h-4 w-4" />
              Receivables
            </Link>
            <Link
              href="/reports/outstanding/payables"
              className={getLinkClass("/reports/outstanding/payables")}
            >
              <LineChart className="h-4 w-4" />
              Payables
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
              Settings
            </div>
            <Link
              href="/settings/organization"
              className={getLinkClass("/settings/organization")}
            >
              <Settings className="h-4 w-4" />
              Organization
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
