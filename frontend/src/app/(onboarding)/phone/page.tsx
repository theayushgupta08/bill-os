"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { Loader } from "@/components/ui/loader";
import {
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2,
  KeyRound,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function PhoneOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stage state: 1 = Enter Phone, 2 = Verify OTP
  const [stage, setStage] = useState<1 | 2>(1);

  // Phone input state
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  // OTP state (6 individual digits)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer state for OTP resend
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean raw digits and check validity
  const rawDigits = phoneNumber.replace(/\s+/g, "");
  const isValidPhone = rawDigits.length >= 7 && rawDigits.length <= 15;
  const fullPhone = `${countryCode} ${rawDigits}`.trim();

  // Handle phone input changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s]/g, "");
    setPhoneNumber(val);
    setError(null);
  };

  // Timer countdown hook for stage 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, timer]);

  // Stage 1: Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError(null);
    setStage(2);
    setTimer(30);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);

    // Auto-focus the first OTP input box on next tick
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // Handle individual OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly && value !== "") return;

    const newOtp = [...otp];

    if (digitsOnly.length > 1) {
      // Handle paste or multiple digits typed
      const pastedDigits = digitsOnly.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = digitsOnly;
      setOtp(newOtp);
      setError(null);

      // Auto advance to next box if digit entered
      if (digitsOnly && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP Paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    const focusIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  // Quick fill demo code helper
  const handleFillDemoOtp = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    setError(null);
    otpInputRefs.current[5]?.focus();
  };

  // Resend OTP action
  const handleResendOtp = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    otpInputRefs.current[0]?.focus();
  };

  // Stage 2: Verify OTP & Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join("");

    if (enteredCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save phone to Supabase auth user metadata
      const supabase = createClient();
      const { error: supabaseErr } = await supabase.auth.updateUser({
        data: { phone: fullPhone },
      });

      if (supabaseErr) {
        console.error("Supabase phone update error:", supabaseErr);
        setError(
          supabaseErr.message ||
            "Failed to update phone number. Please try again."
        );
        setLoading(false);
        return;
      }

      // 2. Best-effort sync to backend database profile
      try {
        await api.put("/users/me/phone", { phone: fullPhone });
      } catch (backendErr) {
        console.warn(
          "Backend phone update deferred; saved in Supabase metadata:",
          backendErr
        );
      }

      // 3. Decide where to go next:
      //    - If user must change password, route to /change-password.
      //    - If user already has organizations, go to dashboard.
      //    - If a returnUrl was passed, honor it.
      //    - Otherwise, go to the organization setup wizard.
      try {
        const mustChange = await api.get<{ mustChangePassword: boolean }>('/users/me/must-change-password');
        if (mustChange?.mustChangePassword) {
          router.push('/change-password');
          return;
        }
      } catch {
        // Non-critical
      }

      try {
        const orgs = await api.get<Array<{ id: string }>>('/organizations');
        if (orgs && orgs.length > 0) {
          localStorage.setItem('active_org_id', orgs[0].id);
          router.push('/dashboard');
          return;
        }
      } catch {
        // Non-critical — fall through to returnUrl or setup
      }

      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        router.push(returnUrl);
      } else {
        router.push('/setup');
      }
    } catch (err: unknown) {
      console.error("Failed to verify phone number:", err);
      setError(errorMessage(err, "Failed to verify phone number. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient lighting & grid backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-teal-500/10 to-zinc-950 z-0" />
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 1: Mobile Verification</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {stage === 1 ? "Verify your phone" : "Enter verification code"}
          </h1>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            {stage === 1
              ? "We'll send a 6-digit OTP code to verify your primary business mobile number."
              : `We've sent a 6-digit code to ${fullPhone}.`}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {error && (
            <div className="mb-6 p-3.5 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 animate-in fade-in-50">
              <span className="font-semibold text-red-300">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* ================= STAGE 1: PHONE INPUT ================= */}
          {stage === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="phone-input"
                  className="text-zinc-200 text-sm font-medium"
                >
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
                      className="bg-zinc-950/70 border-zinc-800 text-center font-mono text-white text-sm focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl"
                    />
                  </div>
                  {/* Phone input */}
                  <div className="relative flex-1">
                    <Input
                      id="phone-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      maxLength={14}
                      className="bg-zinc-950/70 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl"
                      autoFocus
                    />
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                {rawDigits.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 px-1">
                    <span>Formatted Number:</span>
                    <span className="font-mono text-blue-400 font-medium">
                      {fullPhone}
                    </span>
                  </div>
                )}
              </div>

              {/* Security guarantee */}
              <div className="p-3.5 bg-blue-950/30 border border-blue-900/40 rounded-2xl flex items-start gap-3 text-xs text-blue-300/90 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Your number will be used for essential account security alerts
                  and business invoice communication.
                </span>
              </div>

              {/* Submit / Next Button */}
              <Button
                type="submit"
                disabled={!isValidPhone}
                className="w-full h-11 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* ================= STAGE 2: OTP VERIFICATION ================= */}
          {stage === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Phone Recipient summary & Edit action */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-zinc-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{fullPhone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* Demo Mode banner with Quick Auto-fill button */}
              <div className="p-3.5 bg-teal-950/30 border border-teal-800/40 rounded-2xl flex items-center justify-between text-xs text-teal-300">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    Demo OTP: <strong className="font-mono text-white">123456</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Auto-fill
                </button>
              </div>

              {/* 6-Digit Individual OTP Inputs */}
              <div className="space-y-2">
                <Label className="text-zinc-200 text-sm font-medium block text-center">
                  6-Digit OTP Code
                </Label>
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-13 sm:w-13 sm:h-14 bg-zinc-950/80 border border-zinc-800 text-white text-center text-xl sm:text-2xl font-bold font-mono rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP countdown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-500">Didn&apos;t receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="text-zinc-400 font-mono">
                    Resend in 00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                )}
              </div>

              {/* Verify & Continue Action */}
              <Button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full h-11 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader size="sm" text="Verifying..." className="text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          billOS secured phone verification. By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
