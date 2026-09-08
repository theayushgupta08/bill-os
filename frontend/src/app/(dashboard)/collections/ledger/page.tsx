"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandLoader } from "@/components/ui/loader";
import { useCollectionLedger } from "@/features/collections/hooks/use-collections";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function LedgerPage() {
  const { data: ledger, isLoading } = useCollectionLedger();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Collection Ledger</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete history of all verified collections, approved expenses, and settlement deposits.
        </p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/60">
        <CardContent className="p-0">
          {isLoading ? (
            <BrandLoader size="lg" text="Loading ledger..." variant="card" className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Date</TableHead>
                  <TableHead className="text-slate-400 text-xs">Employee</TableHead>
                  <TableHead className="text-slate-400 text-xs">Type</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs">Notes/Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledger ?? []).map((entry) => (
                  <TableRow key={entry.id} className="border-slate-800/40">
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">{entry.userEmail}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                          entry.type === "COLLECTION"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium text-sm ${
                        entry.amount > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {entry.amount > 0 ? "+" : ""}
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm truncate max-w-xs">
                      {entry.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!ledger || ledger.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-12">
                      No ledger entries yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
