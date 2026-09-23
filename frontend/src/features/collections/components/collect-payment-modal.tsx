"use client";


import { useFormat } from "@/lib/use-format";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandLoader } from "@/components/ui/loader";
import {
  useQrCodes,
  useRecordPayment,
  type CollectionQrCode,
} from "@/features/collections/hooks/use-collections";
import { toast } from "sonner";
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const PLACES = [
  { value: "COUNTER", label: "Store / Counter" },
  { value: "SHOP", label: "Shop Floor" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "FIELD", label: "Field / Client Site" },
  { value: "OFFICE", label: "Office" },
];

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export function CollectPaymentModal() {
  const { formatMoney } = useFormat();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "qr" | "success">("select");
  const [selectedQr, setSelectedQr] = useState<CollectionQrCode | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [place, setPlace] = useState("COUNTER");
  const [utrNumber, setUtrNumber] = useState("");

  // Queries & Mutations
  const { data: qrCodes, isLoading: loadingQrs } = useQrCodes();
  const recordMutation = useRecordPayment();

  const activeQrs = (qrCodes ?? []).filter((q) => q.isActive);

  const resetFlow = () => {
    setStep("select");
    setSelectedQr(null);
    setAmount("");
    setPlace("COUNTER");
    setUtrNumber("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetFlow();
    }
  };

  const handleSelectQr = (qr: CollectionQrCode) => {
    setSelectedQr(qr);
    setStep("qr");
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQr) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than 0");
      return;
    }

    try {
      await recordMutation.mutateAsync({
        qrCodeId: selectedQr.id,
        amount: numAmount,
        place: place || "COUNTER",
        utrNumber: utrNumber.trim() || undefined,
      });

      setStep("success");
      toast.success("Payment recorded! Notification sent to QR Owner.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9 rounded-lg shadow-sm shadow-emerald-950/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
            <span className="hidden sm:inline">Collect Payment</span>
            <span className="sm:hidden">Collect</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md md:max-w-lg bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Step 1: Select QR Code */}
        {step === "select" && (
          <div className="p-6 space-y-4">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    Collect Payment
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Select an active QR code to receive customer payment
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {loadingQrs ? (
              <div className="py-12">
                <BrandLoader size="default" text="Loading available QR codes..." variant="card" />
              </div>
            ) : activeQrs.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">No Active QR Codes Found</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Please register or activate employee QR codes under Collections to start collecting payments.
                  </p>
                </div>
                <Button
                  onClick={() => setOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  render={<Link href="/collections/qr" />}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Go to QR Codes
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {activeQrs.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => handleSelectQr(qr)}
                    className="group relative flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm hover:shadow-emerald-950/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                          {qr.nickname}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Owner: {qr.userFirstName} {qr.userLastName}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Full QR View & Amount Entry */}
        {step === "qr" && selectedQr && (
          <div className="p-6 space-y-4">
            {/* Header with back button */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Change QR
              </button>
              <div className="text-right">
                <p className="text-xs font-semibold text-white">{selectedQr.nickname}</p>
                <p className="text-[10px] text-slate-400">
                  {selectedQr.userFirstName} {selectedQr.userLastName}
                </p>
              </div>
            </div>

            {/* Scannable Full QR Code Card */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 inline-flex items-center justify-center">
                {selectedQr.qrImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedQr.qrImageUrl}
                    alt={selectedQr.nickname}
                    className="w-48 h-48 object-contain rounded"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <QrCode className="w-12 h-12 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500">{selectedQr.nickname}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3.5">
              <div>
                <Label htmlFor="collect-amount" className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Enter Amount Received (₹) <span className="text-rose-400">*</span></span>
                  {amount && Number(amount) > 0 && (
                    <span className="text-emerald-400 font-semibold font-mono">
                      {formatMoney(parseFloat(amount))}
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                    ₹
                  </span>
                  <Input
                    id="collect-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-900 border-slate-800 pl-8 text-base font-semibold text-white focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="px-2 py-0.5 text-[11px] rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-colors cursor-pointer"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="collect-place" className="text-xs text-slate-400">
                    Collection Place
                  </Label>
                  <Select value={place} onValueChange={(v) => v && setPlace(v)}>
                    <SelectTrigger id="collect-place" className="bg-slate-900 border-slate-800 text-xs text-white h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {PLACES.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="collect-utr" className="text-xs text-slate-400">
                    UTR / Ref (Optional)
                  </Label>
                  <Input
                    id="collect-utr"
                    placeholder="12-digit UTR"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs text-white h-9 mt-1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={recordMutation.isPending || !amount || Number(amount) <= 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 text-sm shadow-lg shadow-emerald-950/40"
                >
                  {recordMutation.isPending ? (
                    "Recording Payment..."
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Confirm Payment & Notify Owner
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  A notification will be sent immediately to {selectedQr.userFirstName} {selectedQr.userLastName} to verify this payment.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === "success" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-in zoom-in-50 duration-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-white">
                Payment Recorded Successfully!
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                A verification alert has been dispatched to the QR Owner.
              </DialogDescription>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Amount Collected</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {formatMoney(parseFloat(amount || "0"))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">QR Code</span>
                <span className="text-slate-200 font-medium">{selectedQr?.nickname}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">QR Owner</span>
                <span className="text-slate-200 font-medium">
                  {selectedQr?.userFirstName} {selectedQr?.userLastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                  Pending Verification
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                className="flex-1 border-slate-800 text-slate-300 hover:text-white text-xs h-9"
              >
                Collect Another
              </Button>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
