"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  CircleUser,
  Menu,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Settings,
  Building2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useOrganization, getOrgInitials, getOrgGradient } from "@/lib/use-organization";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sales: "Sales",
  invoices: "Invoices",
  quotes: "Quotations",
  orders: "Orders",
  purchases: "Purchases",
  bills: "Bills",
  customers: "Customers",
  suppliers: "Suppliers",
  products: "Products",
  "product-categories": "Categories",
  warehouses: "Warehouses",
  inventory: "Inventory",
  accounts: "Chart of Accounts",
  "journal-entries": "Journal Entries",
  payments: "Payments",
  reports: "Reports",
  pnl: "Profit & Loss",
  gstr1: "GSTR-1",
  gstr3b: "GSTR-3B",
  outstanding: "Outstanding",
  receivables: "Receivables",
  payables: "Payables",
  "audit-logs": "Audit Logs",
  settings: "Settings",
  organization: "Organization",
  tax: "Tax Settings",
  invoice: "Invoice Settings",
  preferences: "Preferences",
  new: "New",
};

function getRouteLabel(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: org } = useOrganization();

  const orgInitials = getOrgInitials(org?.name);
  const orgGradient = getOrgGradient(org?.name);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("active_org_id");
    router.push("/login");
  };

  // Build breadcrumbs
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger render={
          <Button variant="ghost" size="icon" className="shrink-0 md:hidden h-8 w-8" />
        }>
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-slate-950 border-r-border/40 w-72 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {/* Mobile org header */}
          <div className="flex items-center gap-3 h-[60px] px-4 border-b border-border/40">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${orgGradient} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">{orgInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{org?.name || "Your Business"}</p>
              <p className="text-xs text-slate-500">billOS</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Customers", href: "/customers" },
              { label: "Sales Invoices", href: "/sales/invoices" },
              { label: "Purchase Bills", href: "/purchases/bills" },
              { label: "Products", href: "/products" },
              { label: "Inventory", href: "/inventory" },
              { label: "Reports", href: "/reports" },
              { label: "Settings", href: "/settings/organization" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-indigo-500/10 text-indigo-400 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/dashboard" />}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            {paths.map((segment, index) => {
              const href = `/${paths.slice(0, index + 1).join("/")}`;
              const isLast = index === paths.length - 1;
              const label = getRouteLabel(segment);
              return (
                <div key={`${segment}-${index}`} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-foreground">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={href} />}>
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        {/* Mobile: show page title only */}
        <p className="md:hidden text-sm font-semibold text-foreground truncate">
          {paths.length > 0 ? getRouteLabel(paths[paths.length - 1]) : "Dashboard"}
        </p>
      </div>

      {/* Right side: Org pill + Notifications + User menu */}
      <div className="flex items-center gap-2">
        {/* Active org pill */}
        {org && (
          <Link
            href="/settings/organization"
            className="hidden lg:flex items-center gap-1.5 bg-muted/60 hover:bg-muted border border-border/60 rounded-full px-2.5 py-1 transition-colors"
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${orgGradient} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[8px] font-bold">{orgInitials}</span>
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
              {org.name}
            </span>
          </Link>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />
          }>
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {org && (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${orgGradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{orgInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{org.name}</p>
                    {org.gstin && (
                      <p className="text-xs text-muted-foreground font-mono truncate">{org.gstin}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer gap-2" render={<Link href="/settings/organization" />}>
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Organization Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" render={<Link href="/settings/preferences" />}>
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
