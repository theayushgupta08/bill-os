"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  useSettlementDeposits,
  useRecordDeposit,
  useApproveDeposit,
} from "@/features/collections/hooks/use-collections";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const cls = variants[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function DepositsPage() {
  const { data: deposits, isLoading } = useSettlementDeposits();
  const recordMutation = useRecordDeposit();
  const approveMutation = useApproveDeposit();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    depositDate: new Date().toISOString().split("T")[0],
    referenceNumber: "",
    notes: "",
  });

  const handleRecord = async () => {
    await recordMutation.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
    });
    setOpen(false);
    setForm({ amount: "", depositDate: new Date().toISOString().split("T")[0], referenceNumber: "", notes: "" });
  };

  const handleApprove = async (id: string, approve: boolean) => {
    await approveMutation.mutateAsync({ id, approve });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settlement Deposits</h1>
          <p className="text-sm text-slate-400 mt-1">
            Record and approve deposits back to the company bank account.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Record Deposit
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Record Settlement Deposit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="3200.00"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Deposit Date</Label>
                <Input
                  type="date"
                  value={form.depositDate}
                  onChange={(e) => setForm({ ...form, depositDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Reference / UTR Number</Label>
                <Input
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                  placeholder="Bank transfer reference"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={handleRecord}
                disabled={recordMutation.isPending || !form.amount || !form.referenceNumber}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {recordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Deposit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Employee</TableHead>
                  <TableHead className="text-slate-400 text-xs">Date</TableHead>
                  <TableHead className="text-slate-400 text-xs">Reference</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deposits ?? []).map((d) => (
                  <TableRow key={d.id} className="border-slate-800/40">
                    <TableCell className="text-slate-300 text-sm">{d.userEmail}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{d.depositDate}</TableCell>
                    <TableCell className="text-slate-300 text-sm font-mono">{d.referenceNumber}</TableCell>
                    <TableCell className="text-right text-violet-400 font-medium text-sm">
                      {formatCurrency(d.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {d.status === "PENDING_APPROVAL" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(d.id, true)}
                            disabled={approveMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(d.id, false)}
                            disabled={approveMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!deposits || deposits.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                      No settlement deposits yet
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
