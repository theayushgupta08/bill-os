"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  ShoppingBag,
  Package,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

const reportCategories = [
  {
    title: "Financial Statements",
    description: "Analyze organization profits, margins, and financial performance.",
    items: [
      {
        title: "Profit & Loss",
        description: "Summarized snapshot of organization revenues, purchases, and net margins.",
        href: "/reports/pnl",
        icon: TrendingUp,
        color: "text-emerald-450 border-emerald-500/20 bg-emerald-500/5",
        hoverBg: "hover:bg-emerald-500/10",
      },
    ],
  },
  {
    title: "Transactions & Registers",
    description: "Detailed journals of sales invoices and purchase bills logged.",
    items: [
      {
        title: "Sales Register",
        description: "Detailed register of sales invoices generated within a specific timeframe.",
        href: "/reports/sales",
        icon: FileText,
        color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        hoverBg: "hover:bg-indigo-500/10",
      },
      {
        title: "Purchase Register",
        description: "Detailed register of supplier purchase bills logged within a timeframe.",
        href: "/reports/purchases",
        icon: ShoppingBag,
        color: "text-violet-400 border-violet-500/20 bg-violet-500/5",
        hoverBg: "hover:bg-violet-500/10",
      },
    ],
  },
  {
    title: "Outstanding & Balances",
    description: "Track customer collections and supplier payments pending.",
    items: [
      {
        title: "Outstanding Receivables",
        description: "Total payments pending collection from customer invoices.",
        href: "/reports/outstanding/receivables",
        icon: ArrowUpRight,
        color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
        hoverBg: "hover:bg-blue-500/10",
      },
      {
        title: "Outstanding Payables",
        description: "Total bills pending payment to suppliers.",
        href: "/reports/outstanding/payables",
        icon: ArrowDownRight,
        color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        hoverBg: "hover:bg-amber-500/10",
      },
    ],
  },
  {
    title: "GST Returns Filing",
    description: "Download summary reports for tax filing compliances.",
    items: [
      {
        title: "GSTR-1 (Outward supplies)",
        description: "Statement of outward supplies of goods or services for GST filings.",
        href: "/reports/gstr1",
        icon: Percent,
        color: "text-indigo-405 border-indigo-500/20 bg-indigo-500/5",
        hoverBg: "hover:bg-indigo-500/10",
      },
      {
        title: "GSTR-3B (Summary)",
        description: "Monthly summary of supplies to compute final tax liability.",
        href: "/reports/gstr3b",
        icon: Percent,
        color: "text-violet-405 border-violet-500/20 bg-violet-500/5",
        hoverBg: "hover:bg-violet-500/10",
      },
    ],
  },
  {
    title: "Inventory & System Logs",
    description: "Monitor physical stocks and track user activity histories.",
    items: [
      {
        title: "Stock Summary",
        description: "Current available inventory quantities categorized by warehouse locations.",
        href: "/reports/stock",
        icon: Package,
        color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        hoverBg: "hover:bg-indigo-500/10",
      },
      {
        title: "System Audit Logs",
        description: "Track all create, update, and delete actions in your organization.",
        href: "/reports/audit-logs",
        icon: Activity,
        color: "text-slate-400 border-slate-500/20 bg-slate-500/5",
        hoverBg: "hover:bg-slate-500/10",
      },
    ],
  },
];

export default function ReportsOverviewPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 lg:p-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Reports
            <PageHelpTooltip
              title="Financial & Operational Reports"
              description="Access business intelligence summaries, P&L statements, tax compliance filing previews, and audit logs."
            />
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Access financial statements, transaction registers, outstanding ledgers, and tax compliance summary sheets.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {reportCategories.map((category) => (
          <div key={category.title} className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-slate-200">{category.title}</h2>
              <p className="text-xs text-slate-400">{category.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    onClick={() => router.push(item.href)}
                    className={`group border border-slate-700/50 cursor-pointer ${item.hoverBg} transition-all duration-200 shadow-xl bg-slate-900/40 backdrop-blur-sm`}
                  >
                    <CardHeader className="flex flex-row gap-4 items-start pb-4">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center border ${item.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </CardTitle>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-all duration-200 transform group-hover:translate-x-1" />
                        </div>
                        <CardDescription className="text-xs text-slate-405 leading-relaxed pt-0.5">
                          {item.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
