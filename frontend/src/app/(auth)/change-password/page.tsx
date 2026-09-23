"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simple strength metrics
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel =
    score <= 2 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
  const strengthColor =
    score <= 2
      ? "bg-rose-500"
      : score <= 3
      ? "bg-amber-500"
      : score <= 4
      ? "bg-blue-500"
      : "bg-emerald-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      // 1. Call backend to update password in Supabase via Admin API and clear must_change_password flag
      await api.post("/users/me/change-password", { newPassword });

      // 2. Also update in current client session
      try {
        const supabase = createClient();
        await supabase.auth.updateUser({ password: newPassword });
      } catch (clientErr) {
        console.warn("Client session password sync deferred:", clientErr);
      }

      toast.success("Password updated successfully! Welcome to your workspace.");

      // 3. Route to dashboard (or setup if no orgs)
      try {
        const orgs = await api.get<Array<{ id: string }>>("/organizations");
        if (orgs && orgs.length > 0) {
          localStorage.setItem("active_org_id", orgs[0].id);
          router.push("/dashboard");
          return;
        }
      } catch {
        // fall through
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Failed to change password:", err);
      const msg = err instanceof Error ? err.message : "Failed to change password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold w-fit mx-auto lg:mx-0">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Security Setup</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create a New Password</h1>
        <p className="text-sm text-zinc-400">
          Your account was provisioned with a temporary password. Please set a personal password to continue.
        </p>
      </div>

      {error && (
        <div className="p-3.5 text-sm font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* New Password */}
        <div className="grid gap-2">
          <Label htmlFor="new-pwd" className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="new-pwd"
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 pr-10 bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus:border-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Bar */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Password strength:</span>
                <span className="font-semibold text-zinc-200">{strengthLabel}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${Math.min(100, Math.max(15, (score / 5) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="grid gap-2">
          <Label htmlFor="confirm-pwd" className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm-pwd"
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 pr-10 bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs pt-0.5">
              {isMatch ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>

        {/* Requirements Checklist */}
        <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5 text-xs">
          <span className="text-zinc-400 font-semibold block">Password Recommendations:</span>
          <div className="grid grid-cols-2 gap-1.5 text-zinc-400 text-[11px]">
            <span className={hasMinLength ? "text-emerald-400 font-medium" : ""}>
              • At least 8 characters
            </span>
            <span className={hasUpper ? "text-emerald-400 font-medium" : ""}>
              • Uppercase letter (A-Z)
            </span>
            <span className={hasLower ? "text-emerald-400 font-medium" : ""}>
              • Lowercase letter (a-z)
            </span>
            <span className={hasNumber ? "text-emerald-400 font-medium" : ""}>
              • A number (0-9)
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || newPassword.length < 6 || !isMatch}
          className="w-full h-11 mt-2 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating Password...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Update Password & Continue
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
