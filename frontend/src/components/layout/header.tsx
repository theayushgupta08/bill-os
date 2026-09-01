"use client";

import { useEffect, useState } from "react";
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api-client";
import { useNotifications, useMarkNotificationRead } from "@/features/collections/hooks/use-collections";

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
  taxes: "Tax Settings",
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
  const [userName, setUserName] = useState("");

  const orgInitials = getOrgInitials(org?.name);
  const orgGradient = getOrgGradient(org?.name);

  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  
  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const getEmailFromToken = (token: string): string | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload.sub || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const email = getEmailFromToken(token);
        if (email) {
          const prefix = email.split("@")[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
          
          api.get("/team").then((res: any) => {
            const current = res.find(
              (m: any) => m.email.toLowerCase() === email.toLowerCase()
            );
            if (current && current.firstName) {
              setUserName(`${current.firstName} ${current.lastName || ""}`.trim());
            }
          }).catch(() => {});
        }
      }
    }
  }, []);

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
        {/* User name display */}
        {userName && (
          <div
            className="hidden lg:flex items-center gap-1.5 bg-muted/60 border border-border/60 rounded-full px-3 py-1 text-xs font-semibold text-foreground select-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
            {userName}
          </div>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          }>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel className="font-semibold flex justify-between items-center">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-indigo-500/10 text-indigo-400">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              <DropdownMenuGroup>
                {notifications?.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => !notif.readAt && handleMarkRead(notif.id)}>
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-semibold text-sm ${!notif.readAt ? "text-white" : "text-slate-400"}`}>
                        {notif.title}
                      </span>
                      {!notif.readAt && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </div>
                    <span className={`text-xs ${!notif.readAt ? "text-slate-300" : "text-slate-500"} line-clamp-2`}>
                      {notif.message}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />
          }>
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
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
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
