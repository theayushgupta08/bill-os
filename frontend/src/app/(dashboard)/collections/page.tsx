"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HandCoins,
  Clock,
  TrendingUp,
  Landmark,
  Receipt,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  useOwnerDashboard,
  useUserDashboard,
} from "@/features/collections/hooks/use-collections";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(2)}`;
}

function OwnerDashboard() {
  const { data, isLoading } = useOwnerDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      label: "Total Outstanding",
      value: formatCurrency(data.totalOutstandingCollections ?? 0),
      icon: HandCoins,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Pending Verification",
      value: `${data.pendingVerificationCount} (${formatCurrency(data.pendingVerificationSum ?? 0)})`,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Collections Today",
      value: formatCurrency(data.collectionsToday ?? 0),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Deposits Today",
      value: formatCurrency(data.depositsToday ?? 0),
      icon: Landmark,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Expenses Today",
      value: formatCurrency(data.expensesToday ?? 0),
      icon: Receipt,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className={`bg-slate-900/50 border ${m.border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{m.label}</p>
                  <p className="text-lg font-bold text-white">{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Collectors & High Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Top Collectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60">
                  <TableHead className="text-slate-400 text-xs">Name</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Total Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.topCollectors ?? []).map((c, i) => (
                  <TableRow key={i} className="border-slate-800/40">
                    <TableCell className="text-slate-200 text-sm">{c.name}</TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium text-sm">
                      {formatCurrency(c.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.topCollectors || data.topCollectors.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 py-6">
                      No collections yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              High Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60">
                  <TableHead className="text-slate-400 text-xs">Name</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.highOutstandingUsers ?? []).map((u, i) => (
                  <TableRow key={i} className="border-slate-800/40">
                    <TableCell className="text-slate-200 text-sm">{u.name}</TableCell>
                    <TableCell className="text-right text-amber-400 font-medium text-sm">
                      {formatCurrency(u.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.highOutstandingUsers || data.highOutstandingUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 py-6">
                      No outstanding balances
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

function UserDashboardSection() {
  const { data, isLoading } = useUserDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      label: "My Collection Balance",
      value: formatCurrency(data.currentCollectionBalance ?? 0),
      icon: HandCoins,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Pending Verifications",
      value: String(data.pendingVerificationCount ?? 0),
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Today's Collections",
      value: formatCurrency(data.todayCollections ?? 0),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Today's Expenses",
      value: formatCurrency(data.todayExpenses ?? 0),
      icon: Receipt,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Today's Deposits",
      value: formatCurrency(data.todayDeposits ?? 0),
      icon: Landmark,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((m, i) => (
        <Card key={i} className={`bg-slate-900/50 border ${m.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{m.label}</p>
                <p className="text-lg font-bold text-white">{m.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Collections</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track employee UPI collections, expenses, and settlement deposits.
        </p>
      </div>

      {/* User's personal metrics (visible to everyone) */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          My Account
        </h2>
        <UserDashboardSection />
      </section>

      {/* Owner/Admin overview */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Organization Overview
        </h2>
        <OwnerDashboard />
      </section>
    </div>
  );
}
