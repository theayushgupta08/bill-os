"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, KeyRound, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Rate limits and malformed input are worth surfacing; whether the account exists is not (enumeration).
      if (resetError && resetError.status !== 404) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold w-fit mx-auto lg:mx-0">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Account Recovery</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Reset your password</h1>
        <p className="text-sm text-zinc-400">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {sent ? (
        <div className="p-4 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5">
          <MailCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam
            folder) and follow the link to choose a new password.
          </span>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3.5 text-sm font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-11 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </>
      )}

      <div className="text-center text-sm">
        <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
