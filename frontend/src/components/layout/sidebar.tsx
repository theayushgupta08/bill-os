"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Users,
  LineChart,
  BookOpen,
  Receipt,
  FolderTree,
  Building2,
  FileText,
  Settings,
  Package,
  CreditCard,
  Warehouse,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  IndianRupee,
  ScrollText,
  Percent,
  Banknote,
  HandCoins,
  QrCode,
  Landmark,
} from "lucide-react";
import { useOrganization, getOrgInitials, getOrgGradient } from "@/lib/use-organization";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "",
    defaultOpen: true,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Sales",
    defaultOpen: true,
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Quotations", href: "/sales/quotes", icon: FileText },
      { label: "Sales Orders", href: "/sales/orders", icon: ShoppingCart },
      { label: "Sales Invoices", href: "/sales/invoices", icon: Receipt },
      { label: "Payments Received", href: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Purchases",
    defaultOpen: false,
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Users },
      { label: "Purchase Orders", href: "/purchases/orders", icon: FileText },
      { label: "Purchase Bills", href: "/purchases/bills", icon: Receipt },
    ],
  },
  {
    label: "Inventory",
    defaultOpen: false,
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/product-categories", icon: FolderTree },
      { label: "Warehouses", href: "/warehouses", icon: Warehouse },
      { label: "Stock Ledger", href: "/inventory", icon: BookOpen },
    ],
  },
  {
    label: "Accounting",
    defaultOpen: false,
    items: [
      { label: "Chart of Accounts", href: "/accounts", icon: BookOpen },
      { label: "Journal Entries", href: "/journal-entries", icon: ScrollText },
    ],
  },
  {
    label: "Collections",
    defaultOpen: false,
    items: [
      { label: "Overview", href: "/collections", icon: HandCoins, exact: true },
      { label: "QR Codes", href: "/collections/qr", icon: QrCode },
      { label: "Payments", href: "/collections/payments", icon: Banknote },
      { label: "Expenses", href: "/collections/expenses", icon: Receipt },
      { label: "Deposits", href: "/collections/deposits", icon: Landmark },
      { label: "Ledger", href: "/collections/ledger", icon: BookOpen },
    ],
  },
  {
    label: "Reports",
    defaultOpen: false,
    items: [
      { label: "Sales Register", href: "/reports/sales", icon: LineChart },
      { label: "Purchase Register", href: "/reports/purchases", icon: LineChart },
      { label: "Stock Summary", href: "/reports/stock", icon: LineChart },
      { label: "Profit & Loss", href: "/reports/pnl", icon: TrendingUp },
      { label: "GSTR-1", href: "/reports/gstr1", icon: IndianRupee },
      { label: "GSTR-3B", href: "/reports/gstr3b", icon: IndianRupee },
      { label: "Receivables", href: "/reports/outstanding/receivables", icon: LineChart },
      { label: "Payables", href: "/reports/outstanding/payables", icon: LineChart },
      { label: "Audit Logs", href: "/reports/audit-logs", icon: FileText },
    ],
  },
  {
    label: "Settings",
    defaultOpen: false,
    items: [
      { label: "Organization", href: "/settings/organization", icon: Building2 },
      { label: "Tax Settings", href: "/settings/taxes", icon: Percent },
      { label: "Invoice Settings", href: "/settings/invoice", icon: FileText },
      { label: "Preferences", href: "/settings/preferences", icon: Settings },
    ],
  },
];

function NavGroupSection({
  group,
  pathname,
  isOpen,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!group.label) {
    // Render unlabeled items flat (Dashboard)
    return (
      <div className="mb-1">
        {group.items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors group cursor-pointer"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {isOpen && (
        <div className="mt-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150 group/link ${
        isActive
          ? "bg-indigo-500/10 text-indigo-400 font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${
          isActive ? "text-indigo-400" : "text-slate-500 group-hover/link:text-slate-300"
        }`}
      />
      <span className="truncate">{item.label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: org, isLoading } = useOrganization();
  const initials = getOrgInitials(org?.name);
  const gradient = getOrgGradient(org?.name);

  // Helper to determine which group should be open based on pathname
  const getActiveGroupLabel = (path: string): string | null => {
    const matched = navGroups.find(
      (g) =>
        g.label &&
        g.items.some((item) =>
          item.exact ? path === item.href : path.startsWith(item.href)
        )
    );
    if (matched) return matched.label;
    const defaultGroup = navGroups.find((g) => g.label && g.defaultOpen);
    return defaultGroup ? defaultGroup.label : null;
  };

  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    getActiveGroupLabel(pathname)
  );

  // When pathname changes (navigation occurs), ensure the active section's dropdown is open
  useEffect(() => {
    const matched = navGroups.find(
      (g) =>
        g.label &&
        g.items.some((item) =>
          item.exact ? pathname === item.href : pathname.startsWith(item.href)
        )
    );
    if (matched) {
      setOpenGroup(matched.label);
    }
  }, [pathname]);

  const handleToggle = (label: string) => {
    setOpenGroup((prev) => (prev === label ? null : label));
  };

  return (
    <div className="hidden md:flex flex-col h-full border-r border-border/60 bg-slate-950">
      {/* Brand / Org Identity */}
      <div className="flex items-center gap-3 h-[60px] px-4 border-b border-border/40 flex-shrink-0">
        {/* Org Avatar */}
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
        >
          <span className="text-white text-xs font-bold tracking-tight">
            {isLoading ? "…" : initials}
          </span>
        </div>
        {/* Org Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">
            {isLoading ? (
              <span className="animate-pulse bg-slate-700 rounded h-3 w-24 inline-block" />
            ) : (
              org?.name || "Your Business"
            )}
          </p>
          <p className="text-xs text-slate-500 truncate leading-tight">
            {org?.gstin ? `GSTIN: ${org.gstin}` : "billOS"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {navGroups.map((group, idx) => (
          <NavGroupSection
            key={group.label || `flat-${idx}`}
            group={group}
            pathname={pathname}
            isOpen={openGroup === group.label}
            onToggle={() => handleToggle(group.label)}
          />
        ))}
      </div>

      {/* Footer: Settings shortcut */}
      <div className="px-2 pb-3 border-t border-border/40 pt-3 flex-shrink-0">
        <Link
          href="/settings/organization"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150 ${
            pathname.startsWith("/settings")
              ? "bg-indigo-500/10 text-indigo-400 font-medium"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Settings className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
