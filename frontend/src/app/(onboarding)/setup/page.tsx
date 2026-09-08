"use client";

import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { BrandLoader } from "@/components/ui/loader";
import {
  Building2,
  FileText,
  Phone,
  Hash,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const steps = [
  { id: 1, label: "Business Info" },
  { id: 2, label: "Legal Details" },
  { id: 3, label: "Contact" },
];

export default function SetupOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyUserPhone() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const hasMetaPhone = user.phone || user.user_metadata?.phone;
          if (!hasMetaPhone) {
            router.replace("/phone");
          }
        }
      } catch (err) {
        console.warn("Could not verify user phone on setup page:", err);
      }
    }
    verifyUserPhone();
  }, [router]);
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    gstin: "",
    phone: "",
    secondaryPhones: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSecondaryPhoneChange = (index: number, value: string) => {
    const updated = [...formData.secondaryPhones];
    updated[index] = value;
    setFormData({ ...formData, secondaryPhones: updated });
  };

  const addSecondaryPhone = () => {
    if (formData.secondaryPhones.length < 5) {
      setFormData({
        ...formData,
        secondaryPhones: [...formData.secondaryPhones, ""],
      });
    }
  };

  const removeSecondaryPhone = (index: number) => {
    const updated = formData.secondaryPhones.filter((_, i) => i !== index);
    setFormData({ ...formData, secondaryPhones: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ id: string }>("/organizations", formData);
      const orgId = response.id;
      localStorage.setItem("active_org_id", orgId);
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Failed to create organization", err);
      const axiosErr = err as AxiosError<{message: string}>;
      setError(
        axiosErr.response?.data?.message ||
          "Failed to create organization. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration matching auth layout */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-zinc-900 z-0" />
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" />
            Getting Started
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Set up your business
          </h1>
          <p className="text-zinc-400 text-sm">
            Takes less than 2 minutes. You can always update this later.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8 relative z-10 px-2">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10 w-24">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  step === s.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/20"
                    : step > s.id
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-zinc-800/50 text-zinc-500"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  step >= s.id ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Business Info */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Business Details</h2>
                    <p className="text-zinc-400 text-xs">
                      What is the primary name of your company?
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-zinc-300 text-sm font-medium"
                    >
                      Display Name <span className="text-blue-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Acme Corp"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.name}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 mt-4 group"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Legal Details */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Legal Info</h2>
                    <p className="text-zinc-400 text-xs">
                      Official registration details
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="legalName"
                      className="text-zinc-300 text-sm font-medium"
                    >
                      Legal Entity Name
                    </Label>
                    <Input
                      id="legalName"
                      placeholder="e.g. Acme Corporation Pvt Ltd"
                      value={formData.legalName}
                      onChange={handleChange}
                      className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="gstin"
                      className="text-zinc-300 text-sm font-medium"
                    >
                      GSTIN
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="gstin"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={handleChange}
                        className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl pl-10 uppercase"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-11 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 group"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Contact</h2>
                    <p className="text-zinc-400 text-xs">
                      Optional — appears on customer documents
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="phone"
                      className="text-zinc-300 text-sm font-medium"
                    >
                      Business Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      pattern="^\+\d{1,4} \d{4,14}$"
                      title="Format: Country Code + Phone (e.g. +91 9876543210)"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-zinc-300 text-sm font-medium">
                        Secondary Phones
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addSecondaryPhone}
                        disabled={formData.secondaryPhones.length >= 5}
                        className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Phone
                      </Button>
                    </div>
                    {formData.secondaryPhones.map((sp, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="tel"
                          required
                          pattern="^\+\d{1,4} \d{4,14}$"
                          title="Format: Country Code + Phone (e.g. +91 9876543210)"
                          placeholder="+91 9876543210"
                          value={sp}
                          onChange={(e) => handleSecondaryPhoneChange(index, e.target.value)}
                          className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 h-10 rounded-lg flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSecondaryPhone(index)}
                          className="h-10 w-10 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3">
                      {error}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 space-y-2">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-3">
                      Summary
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Business Name</span>
                      <span className="text-white font-medium">
                        {formData.name || "—"}
                      </span>
                    </div>
                    {formData.legalName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Legal Name</span>
                        <span className="text-white font-medium">
                          {formData.legalName}
                        </span>
                      </div>
                    )}
                    {formData.gstin && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">GSTIN</span>
                        <span className="text-white font-mono text-xs">
                          {formData.gstin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-11 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Launch Dashboard
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
