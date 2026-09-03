"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
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
      const response: any = await api.post("/organizations", formData);
      const orgId = response.data?.id || response.id;
      localStorage.setItem("active_org_id", orgId);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Failed to create organization", err);
      setError(
        err?.response?.data?.message ||
          "Failed to create organization. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
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
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" />
            Getting Started
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Set up your business
          </h1>
          <p className="text-slate-400 text-sm">
            Takes less than 2 minutes. You can always update this later.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    step > s.id
                      ? "bg-indigo-500 text-white"
                      : step === s.id
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-600/20"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    step >= s.id ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-16 h-px mx-2 mb-4 transition-colors duration-300 ${
                    step > s.id ? "bg-indigo-500" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Info */}
            <div
              className={`p-8 transition-all duration-300 ${step === 1 ? "block" : "hidden"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    Business Identity
                  </h2>
                  <p className="text-slate-400 text-xs">
                    How your business appears to customers
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-slate-300 text-sm font-medium"
                  >
                    Business Display Name{" "}
                    <span className="text-indigo-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Acme Corp"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl"
                  />
                  <p className="text-slate-500 text-xs">
                    This appears on invoices and reports
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!formData.name}
                className="w-full mt-8 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-40"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Step 2: Legal Details */}
            <div
              className={`p-8 transition-all duration-300 ${step === 2 ? "block" : "hidden"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    Legal Details
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Optional — for tax compliance
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="legalName"
                    className="text-slate-300 text-sm font-medium"
                  >
                    Legal Entity Name
                  </Label>
                  <Input
                    id="legalName"
                    placeholder="e.g. Acme Corporation Pvt. Ltd."
                    value={formData.legalName}
                    onChange={handleChange}
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="gstin"
                    className="text-slate-300 text-sm font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      GSTIN
                      <span className="text-slate-500 font-normal">
                        (optional)
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="gstin"
                    placeholder="29ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-11 rounded-xl font-mono tracking-wider"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-11 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Step 3: Contact */}
            <div
              className={`p-8 transition-all duration-300 ${step === 3 ? "block" : "hidden"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Contact</h2>
                  <p className="text-slate-400 text-xs">
                    Optional — appears on customer documents
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="phone"
                    className="text-slate-300 text-sm font-medium"
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
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300 text-sm font-medium">
                      Secondary Phones
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addSecondaryPhone}
                      disabled={formData.secondaryPhones.length >= 5}
                      className="h-8 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs"
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
                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-10 rounded-lg flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSecondaryPhone(index)}
                        className="h-10 w-10 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
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
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">
                    Summary
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Business Name</span>
                    <span className="text-white font-medium">
                      {formData.name || "—"}
                    </span>
                  </div>
                  {formData.legalName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Legal Name</span>
                      <span className="text-white font-medium">
                        {formData.legalName}
                      </span>
                    </div>
                  )}
                  {formData.gstin && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">GSTIN</span>
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
                  className="flex-1 h-11 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-60"
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
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
