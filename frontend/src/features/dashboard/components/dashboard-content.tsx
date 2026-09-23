"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IndianRupee,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Plus,
  ShoppingCart,
  Package,
  CreditCard,
  AlertCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
import { api } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/use-organization";
import { useRouter } from "next/navigation";

interface DashboardSummary {
  totalRevenueMtd?: number;
  totalExpensesMtd?: number;
  outstandingReceivables?: number;
  outstandingPayables?: number;
  recentInvoices?: any[];
  recentBills?: any[];
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    UNPAID: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ISSUED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    VOID: "bg-red-500/10 text-red-400 border-red-500/20",
    DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    PARTIAL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const cls =
    variants[status?.toUpperCase()] ||
    "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}
    >
      {status}
    </span>
  );
}

const quickActions = [
  {
    label: "New Invoice",
    icon: FileText,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
    border: "border-indigo-500/20",
    path: "/sales/invoices/new",
  },
  {
    label: "Add Sale",
    icon: ShoppingCart,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    border: "border-emerald-500/20",
    path: "/sales/orders/new",
  },
  {
    label: "Add Product",
    icon: Package,
    color: "text-amber-400",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
    border: "border-amber-500/20",
    path: "/products/new",
  },
  {
    label: "Record Payment",
    icon: CreditCard,
    color: "text-violet-400",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
    border: "border-violet-500/20",
    path: "/payments/new",
  },
];

export function DashboardContent() {
  const router = useRouter();

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get<DashboardSummary>("/dashboard/summary");
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <BrandLoader size="lg" text="Loading your dashboard" variant="card" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-foreground font-medium">
            Failed to load dashboard
          </p>
          <p className="text-muted-foreground text-sm">
            Could not fetch your business summary. Please check your connection
            and try again.
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Revenue (MTD)",
      value: formatCurrency(summary.totalRevenueMtd || 0),
      raw: summary.totalRevenueMtd || 0,
      icon: TrendingUp,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      accent: "border-l-emerald-500",
    },
    {
      title: "Expenses (MTD)",
      value: formatCurrency(summary.totalExpensesMtd || 0),
      raw: summary.totalExpensesMtd || 0,
      icon: TrendingDown,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
      accent: "border-l-red-500",
    },
    {
      title: "Receivables",
      value: formatCurrency(summary.outstandingReceivables || 0),
      subtitle: "To be collected",
      icon: ArrowUpRight,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/10",
      accent: "border-l-indigo-500",
    },
    {
      title: "Payables",
      value: formatCurrency(summary.outstandingPayables || 0),
      subtitle: "To be paid",
      icon: ArrowDownRight,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      accent: "border-l-amber-500",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Dashboard
            <PageHelpTooltip
              title="Business Dashboard"
              description="High-level overview of key retail metrics including revenue, orders, inventory alerts, and quick business actions."
            />
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => router.push("/reports")}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => router.push("/sales/invoices/new")}
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.title}
              className={`border-l-4 ${m.accent} hover:shadow-md transition-shadow duration-200`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {m.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.iconBg}`}>
                  <Icon className={`h-4 w-4 ${m.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="text-2xl font-bold tracking-tight">
                  {m.value}
                </div>
                {m.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.path)}
                className={`group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border ${action.border} ${action.bg} transition-all duration-200 cursor-pointer text-center`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.bg} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Sales Invoices
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 px-2 hover:text-foreground"
              onClick={() => router.push("/sales/invoices")}
            >
              View all →
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="pl-6 text-xs">Invoice</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentInvoices?.map((inv: any) => (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/30"
                  >
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {inv.customerName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold text-sm">
                      ₹{inv.totalAmount?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!summary.recentInvoices ||
                  summary.recentInvoices.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground text-sm py-8"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No recent invoices
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Purchase Bills
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 px-2 hover:text-foreground"
              onClick={() => router.push("/purchases/bills")}
            >
              View all →
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="pl-6 text-xs">Bill</TableHead>
                  <TableHead className="text-xs">Supplier</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentBills?.map((bill: any) => (
                  <TableRow
                    key={bill.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/30"
                  >
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {bill.supplierName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={bill.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold text-sm">
                      ₹{bill.totalAmount?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!summary.recentBills || summary.recentBills.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground text-sm py-8"
                    >
                      <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No recent bills
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
