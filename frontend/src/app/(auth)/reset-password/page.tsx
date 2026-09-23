"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, KeyRound, ShieldCheck } from "lucide-react";

/**
 * Landing page for the Supabase recovery email sent from /forgot-password. The browser client exchanges the
 * `?code=` in the URL for a recovery session on initialisation, after which the user may set a new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // getSession() waits for the client to finish exchanging the recovery code from the URL
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setStatus(data.session ? "ready" : "invalid");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled && (event === "PASSWORD_RECOVERY" || session)) setStatus("ready");
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!isMatch) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      // Sign out of the recovery session so the user logs in normally (which also picks their organization)
      await supabase.auth.signOut();
      toast.success("Password updated. Please sign in with your new password.");
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Choose a new password</h1>
      </div>

      {status === "checking" && <p className="text-sm text-zinc-400">Verifying your reset link...</p>}

      {status === "invalid" && (
        <div className="p-4 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            This reset link is invalid or has expired.{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new one
            </Link>
            .
          </span>
        </div>
      )}

      {status === "ready" && (
        <>
          {error && (
            <div className="p-3.5 text-sm font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="new-pwd" className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                New Password
              </Label>
              <Input
                id="new-pwd"
                type="password"
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-pwd" className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Confirm New Password
              </Label>
              <Input
                id="confirm-pwd"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || newPassword.length < 6 || !isMatch}
              className="w-full h-11 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
