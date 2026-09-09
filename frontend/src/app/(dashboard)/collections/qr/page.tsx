"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QrCode, Plus, Loader2, Power, Upload, Trash2 } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import {
  useQrCodes,
  useCreateQrCode,
  useUpdateQrCode,
  type CollectionQrCode,
} from "@/features/collections/hooks/use-collections";
import { toast } from "sonner";

export default function QrCodesPage() {
  const { data: qrCodes, isLoading } = useQrCodes();
  const createMutation = useCreateQrCode();
  const updateMutation = useUpdateQrCode();
  const [open, setOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [qrImage, setQrImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("QR image file must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrImage(reader.result as string);
      toast.success("QR code image selected");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error("Please enter a QR nickname");
      return;
    }
    if (!qrImage) {
      toast.error("Please upload a QR code image");
      return;
    }

    try {
      await createMutation.mutateAsync({
        nickname: nickname.trim(),
        qrImageUrl: qrImage,
      });
      toast.success("QR code registered successfully!");
      setOpen(false);
      setNickname("");
      setQrImage("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to register QR code");
    }
  };

  const toggleActive = async (qr: CollectionQrCode) => {
    await updateMutation.mutateAsync({
      id: qr.id,
      isActive: !qr.isActive,
      nickname: qr.nickname,
      qrImageUrl: qr.qrImageUrl,
    });
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
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setNickname("");
              setQrImage("");
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add QR Code
              </Button>
            }
          />
          <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[440px] p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold">
                Register New QR Code
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              {/* Field 1: QR Nickname */}
              <div className="space-y-1.5">
                <Label htmlFor="qr-nickname" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  QR Nickname
                </Label>
                <Input
                  id="qr-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Counter 1 QR, Rahul's Shop QR"
                  className="h-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                  required
                />
              </div>

              {/* Field 2: Upload QR */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Upload QR
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {qrImage ? (
                  <div className="relative border border-slate-700/80 rounded-2xl p-4 bg-slate-950/60 flex flex-col items-center justify-center">
                    <div className="w-40 h-40 rounded-xl overflow-hidden border border-slate-700 bg-white p-2 shadow-inner flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImage}
                        alt="QR Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 rounded-lg border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQrImage("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="h-8 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 bg-slate-950/40 hover:bg-slate-800/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to upload QR image
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      PNG, JPG, WEBP or SVG up to 5MB
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending || !nickname.trim() || !qrImage}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-medium text-white shadow-md shadow-indigo-600/20"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Register QR Code
              </Button>
            </form>
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
                  <TableHead className="text-slate-400 text-xs">QR Code</TableHead>
                  <TableHead className="text-slate-400 text-xs">Owner</TableHead>
                  <TableHead className="text-slate-400 text-xs">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(qrCodes ?? []).map((qr) => (
                  <TableRow key={qr.id} className="border-slate-800/40">
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-3">
                        {qr.qrImageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 border border-slate-700 shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qr.qrImageUrl}
                              alt={qr.nickname}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 flex items-center justify-center">
                            <QrCode className="h-5 w-5" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{qr.nickname}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {qr.userFirstName ? `${qr.userFirstName} ${qr.userLastName || ""}` : qr.userEmail || "-"}
                    </TableCell>
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
                        title={qr.isActive ? "Deactivate QR Code" : "Activate QR Code"}
                        className="text-slate-400 hover:text-white"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!qrCodes || qrCodes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-12">
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
