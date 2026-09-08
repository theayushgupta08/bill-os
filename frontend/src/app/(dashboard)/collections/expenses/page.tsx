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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import {
  useCollectionExpenses,
  useRecordExpense,
  useApproveExpense,
} from "@/features/collections/hooks/use-collections";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    SUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const cls = variants[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

const CATEGORIES = ["FUEL", "PACKING", "TRAVEL", "FOOD", "COURIER", "MISC"];

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useCollectionExpenses();
  const recordMutation = useRecordExpense();
  const approveMutation = useApproveExpense();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    category: "FUEL",
    vendor: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleRecord = async () => {
    await recordMutation.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
    });
    setOpen(false);
    setForm({ category: "FUEL", vendor: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], notes: "" });
  };

  const handleApprove = async (id: string, approve: boolean) => {
    await approveMutation.mutateAsync({ id, approve });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Collection Expenses</h1>
          <p className="text-sm text-slate-400 mt-1">
            Log business expenses paid from your Collection Balance.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Log Expense
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Log Collection Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Vendor</Label>
                <Input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="e.g. Shell Petrol Pump"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="500.00"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Expense Date</Label>
                <Input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
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
                disabled={recordMutation.isPending || !form.vendor || !form.amount}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {recordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/60">
        <CardContent className="p-0">
          {isLoading ? (
            <BrandLoader size="lg" text="Loading expenses..." variant="card" className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Employee</TableHead>
                  <TableHead className="text-slate-400 text-xs">Category</TableHead>
                  <TableHead className="text-slate-400 text-xs">Vendor</TableHead>
                  <TableHead className="text-slate-400 text-xs">Date</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expenses ?? []).map((e) => (
                  <TableRow key={e.id} className="border-slate-800/40">
                    <TableCell className="text-slate-300 text-sm">{e.userEmail}</TableCell>
                    <TableCell className="text-slate-200 text-sm">{e.category}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{e.vendor}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{e.expenseDate}</TableCell>
                    <TableCell className="text-right text-rose-400 font-medium text-sm">
                      {formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {e.status === "SUBMITTED" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(e.id, true)}
                            disabled={approveMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(e.id, false)}
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
                {(!expenses || expenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                      No expenses logged yet
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
