"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  useCollectionPayments,
  useRecordPayment,
  useVerifyPayment,
  useQrCodes,
} from "@/features/collections/hooks/use-collections";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING_VERIFICATION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    VERIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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

const PLACES = ["SHOP", "ONLINE", "FIELD_VISIT", "OTHER"];

export default function PaymentsPage() {
  const { data: payments, isLoading } = useCollectionPayments();
  const { data: qrCodes } = useQrCodes();
  const recordMutation = useRecordPayment();
  const verifyMutation = useVerifyPayment();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    qrCodeId: "",
    customerId: "",
    amount: "",
    place: "SHOP",
    utrNumber: "",
    referenceNumber: "",
  });

  const handleRecord = async () => {
    await recordMutation.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
    });
    setOpen(false);
    setForm({ qrCodeId: "", customerId: "", amount: "", place: "SHOP", utrNumber: "", referenceNumber: "" });
  };

  const handleVerify = async (id: string, verify: boolean) => {
    await verifyMutation.mutateAsync({ id, verify });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Collection Payments</h1>
          <p className="text-sm text-slate-400 mt-1">
            Record customer payments and verify collections.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Record Payment
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Record Collection Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">QR Code</Label>
                <Select value={form.qrCodeId} onValueChange={(v) => v && setForm({ ...form, qrCodeId: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select QR Code" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(qrCodes ?? []).filter((q) => q.isActive).map((q) => (
                      <SelectItem key={q.id} value={q.id} className="text-white">
                        {q.nickname} ({q.upiId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="2500.00"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Place</Label>
                <Select value={form.place} onValueChange={(v) => v && setForm({ ...form, place: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PLACES.map((p) => (
                      <SelectItem key={p} value={p} className="text-white">
                        {p.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">UTR Number (optional)</Label>
                <Input
                  value={form.utrNumber}
                  onChange={(e) => setForm({ ...form, utrNumber: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Reference Number (optional)</Label>
                <Input
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={handleRecord}
                disabled={recordMutation.isPending || !form.qrCodeId || !form.amount}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {recordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Record Payment
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
                  <TableHead className="text-slate-400 text-xs">QR Code</TableHead>
                  <TableHead className="text-slate-400 text-xs">Recorded By</TableHead>
                  <TableHead className="text-slate-400 text-xs">QR Owner</TableHead>
                  <TableHead className="text-slate-400 text-xs">Place</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments ?? []).map((p) => (
                  <TableRow key={p.id} className="border-slate-800/40">
                    <TableCell className="text-white text-sm">{p.qrCodeNickname}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{p.recordedByEmail}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{p.qrOwnerEmail}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{p.place.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium text-sm">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "PENDING_VERIFICATION" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(p.id, true)}
                            disabled={verifyMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(p.id, false)}
                            disabled={verifyMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!payments || payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                      No payments recorded yet
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
