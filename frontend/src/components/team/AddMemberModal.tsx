"use client";

import { useState } from "react";
import {
  UserPlus,
  User,
  Users,
  Shield,
  ShieldAlert,
  Phone,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateMemberResponse {
  userId: string;
  email: string;
  generatedPassword: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function AddMemberModal({
  onRefresh,
}: {
  onRefresh: () => void;
  emailSuffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setRole("USER");
    setCreatedMember(null);
    setShowPassword(false);
    setCopiedField(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("USER");

  // Success State
  const [createdMember, setCreatedMember] = useState<CreateMemberResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const rawDigits = phoneNumber.replace(/\s+/g, "");
  const fullPhone = `${countryCode} ${rawDigits}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (rawDigits.length < 7 || rawDigits.length > 15) {
      toast.error("Please enter a valid phone number (7-15 digits)");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post<CreateMemberResponse>("/team/members", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        role,
      });

      setCreatedMember(res);
      toast.success("Team member account created successfully!");
      onRefresh();
    } catch (err: unknown) {
      console.error("Failed to create team member:", err);
      const msg = err instanceof Error ? err.message : "Failed to create team member";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldKey: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyAllCredentials = () => {
    if (!createdMember) return;
    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://app.billos.app/login";
    const text = [
      `billOS Account Credentials:`,
      `Name: ${createdMember.firstName} ${createdMember.lastName}`,
      `Email: ${createdMember.email}`,
      `Temporary Password: ${createdMember.generatedPassword}`,
      `Login URL: ${loginUrl}`,
      ``,
      `Note: You will be prompted to set a new password upon first login.`,
    ].join("\n");

    copyToClipboard(text, "all", "All credentials");
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "OWNER":
        return (
          <Badge variant="outline" className="border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-semibold py-0.5">
            Owner
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold py-0.5">
            Admin
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge variant="outline" className="border-blue-500/25 bg-blue-500/10 text-blue-400 text-xs font-semibold py-0.5">
            Manager
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-500/25 bg-slate-500/10 text-slate-300 text-xs font-semibold py-0.5">
            User
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Member
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
        {!createdMember ? (
          <>
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Add Team Member
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Create a login account directly for your staff. Credentials will be generated for you to share.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mem-first" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    First Name <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="mem-first"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Rahul"
                    className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mem-last" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Last Name <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="mem-last"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="mem-phone" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Mobile Phone <span className="text-blue-400">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="w-20 shrink-0">
                    <Input
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white font-mono text-center text-xs"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Input
                      id="mem-phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                      placeholder="98765 43210"
                      maxLength={14}
                      className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white font-mono focus:border-blue-500"
                    />
                    <Phone className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <Label htmlFor="mem-role" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Assign Role <span className="text-blue-400">*</span>
                </Label>
                <Select value={role} onValueChange={(val) => setRole(val ?? role)}>
                  <SelectTrigger
                    id="mem-role"
                    className="w-full h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[var(--anchor-width)] min-w-[320px] rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50"
                  >
                    <SelectItem value="USER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span>User (Billing, orders, products)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MANAGER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-blue-400 shrink-0" />
                        <span>Manager (Records, inventory, reports)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Admin (Team management, settings)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OWNER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>Owner (Full unrestricted ownership)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/20"
                >
                  Create Member Account
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* ================= SUCCESS STATE ================= */
          <div className="space-y-5">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Member Account Created!
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
                    Account created for {createdMember.firstName} {createdMember.lastName}. Share the temporary credentials below.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Credentials Card */}
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-3.5">
              {/* Member Summary Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-100">
                    {createdMember.firstName} {createdMember.lastName}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    New Staff Account
                  </span>
                </div>
                <div>{getRoleBadge(createdMember.role)}</div>
              </div>

              {/* Login Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    Login Email ID
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">billOS Assigned Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={createdMember.email}
                    className="h-10 font-mono text-xs bg-zinc-900 border-zinc-800 text-zinc-100 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdMember.email, "email", "Email ID")}
                    className={cn(
                      "h-10 px-3.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors",
                      copiedField === "email" && "text-emerald-400 border-emerald-500/50 bg-emerald-500/10"
                    )}
                  >
                    {copiedField === "email" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    Temporary Password
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">Must be changed on login</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      type={showPassword ? "text" : "password"}
                      value={createdMember.generatedPassword}
                      className="h-10 font-mono text-sm bg-zinc-900 border-zinc-800 text-zinc-100 select-all pr-10 tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => copyToClipboard(createdMember.generatedPassword, "pwd", "Temporary Password")}
                    className={cn(
                      "h-10 px-3.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all",
                      copiedField === "pwd"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    )}
                  >
                    {copiedField === "pwd" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span className="font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Security Warning */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  This password is shown <strong>only once</strong> and cannot be retrieved later. Copy it now. The user will be prompted to set a new password on their first login.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={copyAllCredentials}
                className={cn(
                  "w-full h-10 rounded-xl border-zinc-700 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                  copiedField === "all" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                )}
              >
                {copiedField === "all" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">All Credentials Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy All Credentials (Ready to Share)</span>
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                  }}
                  className="flex-1 h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium"
                >
                  Add Another Member
                </Button>
                <Button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
