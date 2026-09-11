"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Mail,
  KeyRound,
  User,
  Shield,
  Users,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MemberCredentials {
  userId: string;
  email: string;
  generatedPassword: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface MemberCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: MemberCredentials | null;
  onAddAnother?: () => void;
}

export function MemberCredentialsDialog({
  open,
  onOpenChange,
  credentials,
  onAddAnother,
}: MemberCredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!credentials) return null;

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
    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://app.billos.app/login";
    const text = [
      `billOS Staff Account Credentials:`,
      `Name: ${credentials.firstName} ${credentials.lastName}`,
      `Role: ${credentials.role}`,
      `Email ID: ${credentials.email}`,
      `Temporary Password: ${credentials.generatedPassword}`,
      `Login Portal: ${loginUrl}`,
      ``,
      `Note: You will be prompted to set a new password upon your first login.`,
    ].join("\n");

    copyToClipboard(text, "all", "All credentials");
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "OWNER":
        return (
          <Badge variant="outline" className="border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-semibold py-0.5">
            <ShieldAlert className="w-3 h-3 mr-1" /> Owner
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold py-0.5">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge variant="outline" className="border-blue-500/25 bg-blue-500/10 text-blue-400 text-xs font-semibold py-0.5">
            <Users className="w-3 h-3 mr-1" /> Manager
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-500/25 bg-slate-500/10 text-slate-300 text-xs font-semibold py-0.5">
            <User className="w-3 h-3 mr-1" /> User
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 rounded-2xl bg-zinc-900/98 backdrop-blur-2xl border border-zinc-700/80 shadow-2xl text-zinc-100 z-50">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Team Member Created!
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
                Account created for {credentials.firstName} {credentials.lastName}. Share the temporary credentials below.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Credentials Card */}
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-4 space-y-4 shadow-inner">
          {/* Member Summary Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-100">
                {credentials.firstName} {credentials.lastName}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Staff Login Account
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(credentials.role)}
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium py-0.5">
                Active
              </Badge>
            </div>
          </div>

          {/* Email ID with dedicated Copy button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Login Email ID
              </span>
              <span className="text-[10px] text-zinc-500">Auto-generated</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={credentials.email}
                className="h-10 font-mono text-sm bg-zinc-900 border-zinc-800 text-zinc-100 select-all"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(credentials.email, "email", "Email ID")}
                className={cn(
                  "h-10 px-3.5 rounded-xl text-xs font-medium shrink-0 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all",
                  copiedField === "email" && "text-emerald-400 border-emerald-500/50 bg-emerald-500/10"
                )}
              >
                {copiedField === "email" ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Copy Email</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Temporary Password with Eye Toggle and Copy button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Temporary Password
              </span>
              <span className="text-[10px] text-amber-400 font-medium">One-Time Display</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  type={showPassword ? "text" : "password"}
                  value={credentials.generatedPassword}
                  className="h-10 font-mono text-sm bg-zinc-900 border-zinc-800 text-zinc-100 select-all pr-10 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => copyToClipboard(credentials.generatedPassword, "pwd", "Temporary Password")}
                className={cn(
                  "h-10 px-3.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all",
                  copiedField === "pwd"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
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

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              This password is shown <strong>only once</strong> and cannot be retrieved later. Copy it now. The user will be prompted to set a new password on their first login.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
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
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy All Credentials (Ready to Share)</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 pt-1">
            {onAddAnother && (
              <Button
                type="button"
                variant="outline"
                onClick={onAddAnother}
                className="flex-1 h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium"
              >
                Add Another Member
              </Button>
            )}
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
