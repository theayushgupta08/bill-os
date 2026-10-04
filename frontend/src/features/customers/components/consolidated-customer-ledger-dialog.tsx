"use client";

import { useFormat } from "@/lib/use-format";
import { roundToPaise } from "@/lib/document-totals";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { BookOpen, ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";

interface LedgerEntry {
  id: string;
  transactionDate: string;
  transactionType: "INVOICE" | "PAYMENT";
  documentNumber: string;
  organizationId: string;
  branchName: string;
  branchGstin?: string;
  branchCode?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  notes?: string;
}

interface ConsolidatedCustomerLedger {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    gstin?: string;
    outstandingBalance?: number;
  };
  totalInvoiced: number;
  totalPaid: number;
  netOutstandingBalance: number;
  entries: LedgerEntry[];
}

interface ConsolidatedCustomerLedgerDialogProps {
  customerId: string | null;
  customerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsolidatedCustomerLedgerDialog({
  customerId,
  customerName,
  open,
  onOpenChange,
}: ConsolidatedCustomerLedgerDialogProps) {
  const { formatMoney } = useFormat();
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  const { data, isLoading } = useQuery<ConsolidatedCustomerLedger>({
    queryKey: ["consolidated-ledger", customerId],
    // Only runs when customerId is set (see `enabled`)
    queryFn: () => api.get<ConsolidatedCustomerLedger>(`/customers/${customerId}/consolidated-ledger`),
    enabled: open && !!customerId,
  });

  const entries = data?.entries || [];

  // Extract unique branches from ledger
  const uniqueBranches = Array.from(
    new Set(entries.map((e) => e.branchName).filter(Boolean))
  );

  // One branch's statement runs its own balance; the group-wide running balance would be meaningless here
  const filteredEntries =
    selectedBranch === "ALL"
      ? entries
      : entries
          .filter((e) => e.branchName === selectedBranch)
          .reduce<LedgerEntry[]>((rows, e) => {
            const previous = rows.length > 0 ? Number(rows[rows.length - 1].runningBalance) : 0;
            const runningBalance = roundToPaise(previous + Number(e.debit || 0) - Number(e.credit || 0));
            return [...rows, { ...e, runningBalance }];
          }, []);

  // The summary cards follow the branch filter too
  const summary =
    selectedBranch === "ALL"
      ? {
          invoiced: data?.totalInvoiced || 0,
          paid: data?.totalPaid || 0,
          outstanding: data?.netOutstandingBalance || 0,
        }
      : {
          invoiced: roundToPaise(filteredEntries.reduce((sum, e) => sum + Number(e.debit || 0), 0)),
          paid: roundToPaise(filteredEntries.reduce((sum, e) => sum + Number(e.credit || 0), 0)),
          outstanding: filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].runningBalance : 0,
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-800 text-white max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  Consolidated Customer Statement
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Group Ledger
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Unified transaction statement for <strong className="text-slate-200">{data?.customer?.name || customerName || "Customer"}</strong> across all corporate branches.
                </DialogDescription>
              </div>
            </div>

            {/* Branch Filter */}
            {uniqueBranches.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg p-1">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none pr-2 cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Branches</option>
                  {uniqueBranches.map((b) => (
                    <option key={b} value={b} className="bg-slate-900 text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <BrandLoader size="default" text="Loading consolidated ledger..." />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Total Invoiced
                </span>
                <p className="text-base font-bold text-white mt-0.5">
                  {formatMoney(summary.invoiced)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Total Collected / Paid
                </span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatMoney(summary.paid)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {selectedBranch === "ALL" ? "Net Group Outstanding" : "Net Branch Outstanding"}
                </span>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {formatMoney(summary.outstanding)}
                </p>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950/40 scrollbar-thin">
              <Table>
                <TableHeader className="bg-slate-900/80 sticky top-0 z-10">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-xs text-slate-400 w-24">Date</TableHead>
                    <TableHead className="text-xs text-slate-400">Document #</TableHead>
                    <TableHead className="text-xs text-slate-400">Branch / Unit</TableHead>
                    <TableHead className="text-xs text-slate-400 text-right">Debit (Invoice)</TableHead>
                    <TableHead className="text-xs text-slate-400 text-right">Credit (Payment)</TableHead>
                    <TableHead className="text-xs text-slate-400 text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow className="border-slate-800/50">
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                        No transactions recorded for this customer in this corporate group.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => {
                      const isInvoice = entry.transactionType === "INVOICE";

                      return (
                        <TableRow key={entry.id} className="border-slate-800/50 hover:bg-slate-900/50">
                          <TableCell className="text-xs font-mono text-slate-400">
                            {entry.transactionDate}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-200">
                            <span className="flex items-center gap-1.5">
                              {isInvoice ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              )}
                              <span>{entry.documentNumber || "-"}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[140px]">{entry.branchName}</span>
                              {entry.branchCode && (
                                <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
                                  {entry.branchCode}
                                </span>
                              )}
                            </div>
                            {entry.branchGstin && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {entry.branchGstin}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-slate-200">
                            {entry.debit > 0
                              ? formatMoney(Number(entry.debit))
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-emerald-400">
                            {entry.credit > 0
                              ? formatMoney(Number(entry.credit))
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-amber-400 font-mono">
                            {formatMoney(Number(entry.runningBalance))}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
