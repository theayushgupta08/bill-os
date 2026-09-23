"use client";


import { useFormat } from "@/lib/use-format";
import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, Users } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";

interface PayableRecord {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  outstandingBalance: number;
}

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function PayablesReport() {
  const { formatMoney } = useFormat();
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["outstanding-payables"],
    queryFn: async () => {
      const res = await api.get<PayableRecord[]>(`/reports/outstanding-payables`);
      return res;
    }
  });

  const totalOutstanding = suppliers.reduce((acc: number, curr: PayableRecord) => acc + (curr.outstandingBalance || 0), 0);

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <ArrowDownRight className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Outstanding Payables
            <PageHelpTooltip
              title="Accounts Payable & Aging"
              description="Total bills pending payment to suppliers, organized by vendor and aging brackets."
            />
          </h2>
          <p className="text-sm text-slate-400">Total bills pending payment to suppliers.</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-amber-950/20 border border-amber-500/25 p-5 rounded-xl flex items-center justify-between shadow-lg">
        <div>
          <h3 className="font-semibold text-base text-slate-300">Total Amount to Pay</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sum of all outstanding supplier balances</p>
        </div>
        <div className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight flex items-center">
          {formatMoney(totalOutstanding)}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Supplier Name</TableHead>
              <TableHead className="text-slate-400 font-semibold">GSTIN</TableHead>
              <TableHead className="text-slate-400 font-semibold">Phone</TableHead>
              <TableHead className="text-right pr-6 text-slate-400 font-semibold">Outstanding Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading outstanding ledger..." size="lg" />
                </TableCell>
              </TableRow>
            ) : suppliers.map((s: PayableRecord, idx: number) => (
              <TableRow key={idx} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="font-semibold text-white pl-6 py-4">{s.name}</TableCell>
                <TableCell className="text-slate-300 font-mono text-xs">{s.gstin || "—"}</TableCell>
                <TableCell className="text-slate-300 text-sm">{s.phone || "—"}</TableCell>
                <TableCell className="text-right pr-6 font-mono text-sm font-semibold text-amber-400">
                  {formatMoney(s.outstandingBalance)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No outstanding supplier balances.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
