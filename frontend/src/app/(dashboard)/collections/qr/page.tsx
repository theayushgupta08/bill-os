"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { QrCode, Plus, Loader2, Power } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import {
  useQrCodes,
  useCreateQrCode,
  useUpdateQrCode,
  type CollectionQrCode,
} from "@/features/collections/hooks/use-collections";

const PAYMENT_PROVIDERS = ["UPI", "PHONEPE", "GOOGLEPAY", "PAYTM", "BHIM", "OTHER"];

export default function QrCodesPage() {
  const { data: qrCodes, isLoading } = useQrCodes();
  const createMutation = useCreateQrCode();
  const updateMutation = useUpdateQrCode();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    paymentProvider: "UPI",
    upiName: "",
    upiId: "",
    nickname: "",
    qrImageUrl: "",
    notes: "",
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(form);
    setOpen(false);
    setForm({ userId: "", paymentProvider: "UPI", upiName: "", upiId: "", nickname: "", qrImageUrl: "", notes: "" });
  };

  const toggleActive = async (qr: CollectionQrCode) => {
    await updateMutation.mutateAsync({ id: qr.id, isActive: !qr.isActive, nickname: qr.nickname, qrImageUrl: qr.qrImageUrl, notes: qr.notes });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QR Codes</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage employee UPI QR codes used for collecting payments.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add QR Code
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Register New QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">User ID</Label>
                <Input
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  placeholder="Enter user UUID"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Payment Provider</Label>
                <Select value={form.paymentProvider} onValueChange={(v) => v && setForm({ ...form, paymentProvider: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PAYMENT_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p} className="text-white">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">UPI Account Name</Label>
                <Input
                  value={form.upiName}
                  onChange={(e) => setForm({ ...form, upiName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">UPI ID (VPA)</Label>
                <Input
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="e.g. rahul@okhdfcbank"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Nickname</Label>
                <Input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="e.g. Rahul's Shop QR"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">QR Image URL (optional)</Label>
                <Input
                  value={form.qrImageUrl}
                  onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/60">
        <CardContent className="p-0">
          {isLoading ? (
            <BrandLoader size="lg" text="Loading QR codes..." variant="card" className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Nickname</TableHead>
                  <TableHead className="text-slate-400 text-xs">Owner</TableHead>
                  <TableHead className="text-slate-400 text-xs">Provider</TableHead>
                  <TableHead className="text-slate-400 text-xs">UPI Name</TableHead>
                  <TableHead className="text-slate-400 text-xs">UPI ID</TableHead>
                  <TableHead className="text-slate-400 text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(qrCodes ?? []).map((qr) => (
                  <TableRow key={qr.id} className="border-slate-800/40">
                    <TableCell className="text-white font-medium flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-indigo-400" />
                      {qr.nickname}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {qr.userFirstName} {qr.userLastName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {qr.paymentProvider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">{qr.upiName}</TableCell>
                    <TableCell className="text-slate-400 text-sm font-mono">{qr.upiId}</TableCell>
                    <TableCell>
                      {qr.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(qr)}
                        disabled={updateMutation.isPending}
                        className="text-slate-400 hover:text-white"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!qrCodes || qrCodes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                      No QR codes registered yet
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
