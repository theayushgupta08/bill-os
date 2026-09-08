"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { Loader } from "@/components/ui/loader";
import { Phone, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function PhoneOnboardingPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and spaces
    const val = e.target.value.replace(/[^\d\s]/g, "");
    setPhoneNumber(val);
    setError(null);
  };

  const fullPhone = `${countryCode} ${phoneNumber.replace(/\s+/g, "")}`.trim();
  const rawDigits = phoneNumber.replace(/\s+/g, "");
  const isValid = rawDigits.length >= 7 && rawDigits.length <= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("Please enter a valid phone number (e.g. 10 digits).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save directly to Supabase auth user metadata
      const supabase = createClient();
      const { error: supabaseErr } = await supabase.auth.updateUser({
        data: { phone: fullPhone },
      });

      if (supabaseErr) {
        console.error("Supabase phone update error:", supabaseErr);
        setError(supabaseErr.message || "Failed to update phone number. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Best-effort sync to backend database profile
      try {
        await api.put("/users/me/phone", { phone: fullPhone });
      } catch (backendErr) {
        console.warn("Backend phone update deferred; saved in Supabase metadata:", backendErr);
      }

      // 3. Move to organization setup
      router.push("/setup");
    } catch (err: unknown) {
      console.error("Failed to update phone number:", err);
      const errorMessage =
        (err as Error)?.message ||
        (err as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Failed to save phone number. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration matching billOS auth aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-zinc-900 z-0" />
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" />
            Step 1: Contact Information
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Enter your phone number
          </h1>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            Please provide your mobile number to complete your profile.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-800/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 animate-in fade-in-50">
                <span className="font-semibold text-red-300">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone-input" className="text-zinc-200 text-sm font-medium">
                Mobile Phone Number
              </Label>
              <div className="flex gap-2.5">
                {/* Country code input */}
                <div className="w-24 shrink-0">
                  <Input
                    id="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+91"
                    className="bg-zinc-900/60 border-zinc-700 text-center font-mono text-white text-sm focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                {/* Number input */}
                <div className="relative flex-1">
                  <Input
                    id="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="bg-zinc-900/60 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {rawDigits.length > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 px-1">
                  <span>Formatted:</span>
                  <span className="font-mono text-blue-400 font-medium">
                    {countryCode} {rawDigits}
                  </span>
                </div>
              )}
            </div>

            {/* Note regarding OTP verification */}
            <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-300/90 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Phone verification via OTP will be enabled in a future release. Please ensure this is your active business mobile number.
              </span>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader size="sm" text="Saving..." className="text-white" />
              ) : (
                <>
                  <span>Continue to Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
