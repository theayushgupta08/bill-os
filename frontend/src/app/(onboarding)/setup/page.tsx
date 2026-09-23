"use client";


import { useSuffixAvailability } from "@/hooks/use-suffix-availability";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { BrandLoader } from "@/components/ui/loader";
import {
  Building2,
  FileText,
  Percent,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Globe,
  Upload,
  AlertCircle,
  Landmark,
  ShieldCheck,
  Check,
} from "lucide-react";

// Steps definition
const STEPS = [
  { id: 1, title: "Business Details", icon: Building2 },
  { id: 2, title: "Settings & Bank", icon: FileText },
  { id: 3, title: "Tax Slabs", icon: Percent },
  { id: 4, title: "Warehouses", icon: WarehouseIcon },
  { id: 5, title: "Review & Preview", icon: CheckCircle2 },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh"
];

// Reasoning messages for loader loop
const REASONING_STAGES = [
  { text: "Creating Your Personalised Dashboard...", sub: "Initializing workspace metadata" },
  { text: "Configuring Tax Slabs & GST Rules...", sub: "Calibrating CGST, SGST, and IGST engines" },
  { text: "Setting Up Invoice Templates & Bank Details...", sub: "Formatting terms and payment credentials" },
  { text: "Provisioning Warehouses & Storage Facilities...", sub: "Allocating inventory storage nodes" },
  { text: "Initializing Chart of Accounts & General Ledger...", sub: "Setting up double-entry ledger" },
  { text: "Customizing Workspace Preferences...", sub: "Applying regional date formats and timezone" },
  { text: "Finalizing Your billOS Environment...", sub: "Taking you to your new dashboard" },
];

export default function SetupOrganizationPage() {
  const router = useRouter();

  // Current wizard step (1 to 5)
  const [step, setStep] = useState(1);

  // Reasoning loader state
  const [isLaunching, setIsLaunching] = useState(false);
  const [reasoningIndex, setReasoningIndex] = useState(0);

  // Form Global Error
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // STEP 1: Business Identity & Contact
  // -------------------------------------------------------------
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [gstin, setGstin] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhones, setSecondaryPhones] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Email Suffix for Team Accounts
  const [emailSuffix, setEmailSuffix] = useState("");
  const {
    available: suffixAvailable,
    error: suffixError,
    checking: suffixChecking,
  } = useSuffixAvailability(emailSuffix);


  // -------------------------------------------------------------
  // STEP 2: Organisation Settings & Bank Details
  // -------------------------------------------------------------
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("English");
  const [invoiceTerms, setInvoiceTerms] = useState<string[]>([
    "Payment is due within 30 days of invoice date.",
    "Goods once sold will not be accepted back without original invoice.",
    "Interest @ 18% per annum will be charged on delayed payments.",
  ]);
  const [newTermInput, setNewTermInput] = useState("");

  // Bank Details
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [bankAddress, setBankAddress] = useState("");

  // -------------------------------------------------------------
  // STEP 3: Tax Slabs
  // -------------------------------------------------------------
  interface TaxSlabItem {
    id: string;
    name: string;
    rate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    isDefault?: boolean;
  }

  const [taxSlabs, setTaxSlabs] = useState<TaxSlabItem[]>([
    {
      id: "default-18",
      name: "GST 18% (9% CGST + 9% SGST)",
      rate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      isDefault: true,
    },
  ]);

  // Custom tax slab form state
  const [customSlabName, setCustomSlabName] = useState("");
  const [customSlabRate, setCustomSlabRate] = useState<number | "">("");
  const [showCustomTaxModal, setShowCustomTaxModal] = useState(false);

  // -------------------------------------------------------------
  // STEP 4: Warehouses
  // -------------------------------------------------------------
  interface WarehouseItem {
    id: string;
    name: string;
    code: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isPrimary: boolean;
  }

  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([
    {
      id: "wh-primary",
      name: "Primary Warehouse",
      code: "MAIN",
      isPrimary: true,
    },
  ]);

  // -------------------------------------------------------------
  // Initial Verification: Ensure User Has Verified Phone
  // -------------------------------------------------------------
  useEffect(() => {
    async function checkUserSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const userMetaPhone = user.phone || user.user_metadata?.phone;
          if (!userMetaPhone) {
            router.replace("/phone");
            return;
          }
          setPhone(userMetaPhone);
          if (user.email && !email) {
            setEmail(user.email);
          }
        }
      } catch (err) {
        console.warn("Could not check user phone on setup:", err);
      }
    }
    checkUserSession();
  }, [router, email]);

  // Reasoning animation loop when launching dashboard
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLaunching) {
      interval = setInterval(() => {
        setReasoningIndex((prev) => (prev + 1) % REASONING_STAGES.length);
      }, 900);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLaunching]);

  // -------------------------------------------------------------
  // Logo Upload Handler
  // -------------------------------------------------------------
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo image size must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setLogoUrl(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // Secondary Phones Handlers
  // -------------------------------------------------------------
  const addSecondaryPhone = () => {
    if (secondaryPhones.length < 5) {
      setSecondaryPhones([...secondaryPhones, ""]);
    }
  };

  const updateSecondaryPhone = (index: number, val: string) => {
    const updated = [...secondaryPhones];
    updated[index] = val;
    setSecondaryPhones(updated);
  };

  const removeSecondaryPhone = (index: number) => {
    setSecondaryPhones(secondaryPhones.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------
  // Invoice Terms Handlers
  // -------------------------------------------------------------
  const addInvoiceTerm = () => {
    if (newTermInput.trim()) {
      setInvoiceTerms([...invoiceTerms, newTermInput.trim()]);
      setNewTermInput("");
    }
  };

  const removeInvoiceTerm = (index: number) => {
    setInvoiceTerms(invoiceTerms.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------
  // Tax Slab Handlers
  // -------------------------------------------------------------
  const addPresetTaxSlab = (rate: number, name: string) => {
    if (taxSlabs.some((s) => s.rate === rate)) return;
    const cgst = rate / 2;
    const sgst = rate / 2;
    setTaxSlabs([
      ...taxSlabs,
      {
        id: `slab-${rate}`,
        name: `${name} (${cgst}% CGST + ${sgst}% SGST)`,
        rate,
        cgstRate: cgst,
        sgstRate: sgst,
        igstRate: 0,
      },
    ]);
  };

  const handleAddCustomTaxSlab = () => {
    if (customSlabRate === "" || isNaN(Number(customSlabRate))) return;
    const rateVal = Number(customSlabRate);
    const slabTitle =
      customSlabName.trim() || `GST ${rateVal}% (${rateVal / 2}% + ${rateVal / 2}%)`;

    setTaxSlabs([
      ...taxSlabs,
      {
        id: `slab-custom-${Date.now()}`,
        name: slabTitle,
        rate: rateVal,
        cgstRate: rateVal / 2,
        sgstRate: rateVal / 2,
        igstRate: 0,
      },
    ]);
    setCustomSlabName("");
    setCustomSlabRate("");
    setShowCustomTaxModal(false);
  };

  const removeTaxSlab = (id: string) => {
    if (taxSlabs.length <= 1) {
      setError("You must have at least one configured tax slab.");
      return;
    }
    setTaxSlabs(taxSlabs.filter((s) => s.id !== id));
  };

  // -------------------------------------------------------------
  // Warehouse Handlers (Primary + Fallback Naming)
  // -------------------------------------------------------------
  const addWarehouse = () => {
    // Generate fallback auto-number "Warehouse 1", "Warehouse 2", etc.
    const count = warehouses.length; // e.g. 1 existing -> next is Warehouse 1 or 2
    const nextNum = count === 1 ? 1 : count;
    setWarehouses([
      ...warehouses,
      {
        id: `wh-${Date.now()}`,
        name: `Warehouse ${nextNum}`,
        code: `WH-${nextNum}`,
        isPrimary: false,
      },
    ]);
  };

  const updateWarehouseField = (
    index: number,
    field: keyof WarehouseItem,
    value: string
  ) => {
    const updated = [...warehouses];
    updated[index] = { ...updated[index], [field]: value };
    setWarehouses(updated);
  };

  const copyBusinessAddressToWarehouse = (index: number) => {
    const updated = [...warehouses];
    updated[index] = {
      ...updated[index],
      addressLine1,
      city,
      state: stateName,
      pincode,
    };
    setWarehouses(updated);
  };

  const removeWarehouse = (index: number) => {
    if (warehouses[index].isPrimary) {
      setError("Cannot delete the Primary Warehouse.");
      return;
    }
    setWarehouses(warehouses.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------
  // Validation per step
  // -------------------------------------------------------------
  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setError("Business display name is mandatory.");
        return false;
      }
      if (!gstin.trim()) {
        setError("GSTIN is mandatory.");
        return false;
      }
      const gstinRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin.trim().toUpperCase())) {
        setError(
          "Invalid GSTIN format. Must be 15 characters (e.g. 22AAAAA0000A1Z5)."
        );
        return false;
      }
      if (!addressLine1.trim()) {
        setError("Address Line 1 is mandatory.");
        return false;
      }
      if (!city.trim()) {
        setError("City is mandatory.");
        return false;
      }
      if (!stateName.trim()) {
        setError("State is mandatory.");
        return false;
      }
      if (!pincode.trim() || pincode.replace(/\D/g, "").length < 6) {
        setError("Pincode is mandatory and must be 6 digits.");
        return false;
      }
      if (!phone.trim()) {
        setError("Primary business phone is mandatory.");
        return false;
      }
      if (!emailSuffix.trim()) {
        setError("Team email suffix is mandatory.");
        return false;
      }
      if (suffixAvailable !== true) {
        setError(suffixError || "Please choose a valid and available email suffix.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // -------------------------------------------------------------
  // Final Submission: Launch Dashboard
  // -------------------------------------------------------------
  const handleLaunchDashboard = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setIsLaunching(true);
    setError(null);

    // Prepare warehouses with fallback names if empty
    let fallbackCounter = 1;
    const preparedWarehouses = warehouses.map((wh) => {
      let finalName = wh.name.trim();
      if (!finalName) {
        finalName = wh.isPrimary ? "Primary Warehouse" : `Warehouse ${fallbackCounter}`;
      }
      if (!wh.isPrimary) {
        fallbackCounter++;
      }
      return {
        name: finalName,
        code: wh.code.trim().toUpperCase() || (wh.isPrimary ? "MAIN" : `WH-${fallbackCounter}`),
        addressLine1: wh.addressLine1 || addressLine1,
        addressLine2: addressLine2 || "",
        city: wh.city || city,
        state: wh.state || stateName,
        pincode: wh.pincode || pincode,
        isPrimary: wh.isPrimary,
      };
    });

    const payload = {
      name: name.trim(),
      legalName: legalName.trim() || name.trim(),
      emailSuffix: emailSuffix.trim().toLowerCase(),
      gstin: gstin.trim().toUpperCase(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      email: email.trim() || null,
      phone: phone.trim(),
      secondaryPhones: secondaryPhones.filter((p) => p && p.trim() !== ""),
      website: website.trim() || null,
      logoUrl: logoUrl || null,
      dateFormat,
      invoicePrefix: invoicePrefix.trim() || "INV-",
      invoiceTerms,
      timezone,
      language,
      bankDetails: {
        bankName: bankName.trim() || null,
        accountHolder: accountHolder.trim() || null,
        accountNumber: accountNumber.trim() || null,
        ifscCode: ifscCode.trim().toUpperCase() || null,
        branchName: branchName.trim() || null,
        bankAddress: bankAddress.trim() || null,
      },
      taxSlabs: taxSlabs.map((s) => ({
        name: s.name,
        rate: s.rate,
        cgstRate: s.cgstRate,
        sgstRate: s.sgstRate,
        igstRate: s.igstRate,
      })),
      warehouses: preparedWarehouses,
    };

    try {
      const startTime = Date.now();
      const response = await api.post<{ id: string }>("/organizations/setup", payload);
      const orgId = response.id;
      localStorage.setItem("active_org_id", orgId);

      // Keep reasoning animation running for min 2.8s for smooth cinematic experience
      const elapsed = Date.now() - startTime;
      const minWait = 2800;
      if (elapsed < minWait) {
        await new Promise((resolve) => setTimeout(resolve, minWait - elapsed));
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Failed to setup organization:", err);
      setIsLaunching(false);
      setError(errorMessage(err, "Failed to complete organization setup. Please try again."));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-zinc-950 z-0" />
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* ================= REASONING FULL-PAGE LOADER ================= */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-md w-full flex flex-col items-center gap-6">
            <BrandLoader size="xl" variant="inline" interactive={false} />

            <div className="space-y-3 min-h-[90px] flex flex-col items-center justify-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">
                {REASONING_STAGES[reasoningIndex].text}
              </h2>
              <p className="text-zinc-400 text-sm font-mono flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                {REASONING_STAGES[reasoningIndex].sub}
              </p>
            </div>

            {/* Progress line */}
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500 transition-all duration-700 ease-out"
                style={{
                  width: `${((reasoningIndex + 1) / REASONING_STAGES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Wizard Container */}
      <div className="w-full max-w-3xl relative z-10 my-8">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Setup</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Configure your billOS workspace
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-md mx-auto">
            Set up your organization, tax compliance, invoicing, and storage in a few easy steps.
          </p>
        </div>

        {/* Step Indicator Tracker */}
        <div className="grid grid-cols-5 gap-2 mb-8 px-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isCurrent = step === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (isDone) setStep(s.id);
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-zinc-800/80 border border-blue-500/30 text-white shadow-lg shadow-blue-500/10"
                    : isDone
                    ? "text-zinc-300 hover:bg-zinc-900/60 cursor-pointer"
                    : "text-zinc-600 opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/30"
                      : isDone
                      ? "bg-teal-500/20 text-teal-400"
                      : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-medium truncate max-w-full text-center hidden sm:inline">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Wizard Main Card */}
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 relative">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-300 block">Please resolve the error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* ================= STEP 1: BUSINESS DETAILS ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Business Details</h2>
                  <p className="text-zinc-400 text-xs">
                    Legal identity and primary contact details for your business
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Business Display Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="biz-name" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Business Display Name <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="biz-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Innovations"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                    autoFocus
                  />
                </div>

                {/* Legal Entity Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-legal" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Legal Entity Name <span className="text-zinc-500 text-[10px]">(Optional)</span>
                  </Label>
                  <Input
                    id="biz-legal"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Acme Innovations Pvt Ltd"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-gstin" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Business GSTIN <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="biz-gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="bg-zinc-950/70 border-zinc-800 text-white font-mono uppercase rounded-xl h-11"
                  />
                </div>

                {/* Email Suffix for Team Accounts */}
                <div className="space-y-2 md:col-span-2 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="biz-suffix" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                      Team Email Suffix <span className="text-blue-400">*</span>
                    </Label>
                    <span className="text-[11px] text-zinc-500">Cannot be changed later</span>
                  </div>
                  <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/60 focus-within:border-blue-500 overflow-hidden">
                    <Input
                      id="biz-suffix"
                      value={emailSuffix}
                      onChange={(e) => setEmailSuffix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="e.g. myshop"
                      maxLength={30}
                      className="border-0 bg-transparent text-white font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                    />
                    <span className="px-3 text-zinc-400 font-mono text-xs bg-zinc-800/80 h-11 flex items-center border-l border-zinc-800 select-none">
                      .billos.app
                    </span>
                  </div>
                  {suffixChecking && (
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 animate-pulse">
                      Checking availability...
                    </p>
                  )}
                  {!suffixChecking && suffixAvailable === true && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Available! Staff login emails will be:
                      </p>
                      <p className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 inline-block">
                        firstname.lastname.XX@{emailSuffix.trim().toLowerCase()}.billos.app
                      </p>
                    </div>
                  )}
                  {!suffixChecking && suffixAvailable === false && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {suffixError || "This suffix is not available. Please choose another."}
                    </p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="biz-addr1" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Address Line 1 <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="biz-addr1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Building, Street, Area"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="biz-addr2" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Address Line 2 <span className="text-zinc-500 text-[10px]">(Optional)</span>
                  </Label>
                  <Input
                    id="biz-addr2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, Suite, Unit"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-city" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    City <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="biz-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-state" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    State <span className="text-blue-400">*</span>
                  </Label>
                  <select
                    id="biz-state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-pin" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Pincode <span className="text-blue-400">*</span>
                  </Label>
                  <Input
                    id="biz-pin"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 400001"
                    maxLength={6}
                    className="bg-zinc-950/70 border-zinc-800 text-white font-mono rounded-xl h-11"
                  />
                </div>

                {/* Business Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-email" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Business Email <span className="text-zinc-500 text-[10px]">(Optional)</span>
                  </Label>
                  <Input
                    id="biz-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11"
                  />
                </div>

                {/* Primary Phone (Verified) */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-phone" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Primary Phone (Verified) <span className="text-blue-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="biz-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-zinc-950/70 border-zinc-800 text-white font-mono rounded-xl h-11 pr-24"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                  <Label htmlFor="biz-web" className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Business Website <span className="text-zinc-500 text-[10px]">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="biz-web"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                      className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-11 pl-9"
                    />
                    <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Secondary Phones */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                      Secondary Mobile Numbers <span className="text-zinc-500 text-[10px]">(Optional)</span>
                    </Label>
                    <button
                      type="button"
                      onClick={addSecondaryPhone}
                      disabled={secondaryPhones.length >= 5}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Number
                    </button>
                  </div>
                  {secondaryPhones.map((secPhone, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={secPhone}
                        onChange={(e) => updateSecondaryPhone(idx, e.target.value)}
                        placeholder="+91 9876543211"
                        className="bg-zinc-950/70 border-zinc-800 text-white font-mono rounded-xl h-10 flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSecondaryPhone(idx)}
                        className="h-10 w-10 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Business Logo Upload / Dropzone */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Business Logo <span className="text-zinc-500 text-[10px]">(Optional)</span>
                  </Label>
                  <div className="flex items-center gap-4 p-4 border border-dashed border-zinc-800 bg-zinc-950/40 rounded-2xl">
                    <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo Preview"
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="h-9 border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white rounded-xl text-xs gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Image
                      </Button>
                      <p className="text-[11px] text-zinc-500">
                        Recommended: Square PNG or SVG, max 2MB. Appears on invoice headers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: ORGANISATION SETTINGS & BANK ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Organisation Settings & Bank</h2>
                  <p className="text-zinc-400 text-xs">
                    Invoicing formats, regional preferences, and bank details to print on customer invoices
                  </p>
                </div>
              </div>

              {/* Invoicing Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date Format */}
                <div className="space-y-1.5">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Date Format
                  </Label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:border-blue-500 focus:outline-none font-mono"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-31)</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 31-Dec-2026)</option>
                  </select>
                </div>

                {/* Invoice Prefix */}
                <div className="space-y-1.5">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Invoice Prefix
                  </Label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    className="bg-zinc-950/70 border-zinc-800 text-white font-mono rounded-xl h-11"
                  />
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Timezone
                  </Label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Language
                  </Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                  <Landmark className="w-4 h-4 text-teal-400" />
                  <h3 className="text-zinc-200 font-semibold text-sm">Bank Details (Printed on Invoices)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Account Holder Name</Label>
                    <Input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="e.g. Acme Corporation Pvt Ltd"
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Account Number</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="50200012345678"
                      className="bg-zinc-900 border-zinc-800 text-white font-mono rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">IFSC Code</Label>
                    <Input
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      maxLength={11}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono uppercase rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Branch Name</Label>
                    <Input
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Nariman Point Branch"
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Bank Branch Address</Label>
                    <Input
                      value={bankAddress}
                      onChange={(e) => setBankAddress(e.target.value)}
                      placeholder="e.g. Ground Floor, Express Towers, Nariman Point, Mumbai"
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Bullet Terms and Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                    Invoice Terms & Conditions (In Bullet Points)
                  </Label>
                  <span className="text-zinc-500 text-xs">
                    {invoiceTerms.length} bullet points
                  </span>
                </div>

                <div className="space-y-2">
                  {invoiceTerms.map((term, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mx-1" />
                      <span className="text-zinc-300 flex-1">{term}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvoiceTerm(idx)}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Term Input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newTermInput}
                    onChange={(e) => setNewTermInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInvoiceTerm();
                      }
                    }}
                    placeholder="Type a new term and press enter (e.g. Warranty valid for 1 year)"
                    className="bg-zinc-950/70 border-zinc-800 text-white rounded-xl h-10 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addInvoiceTerm}
                    variant="outline"
                    className="h-10 border-zinc-700 bg-zinc-900 text-zinc-200 rounded-xl text-xs px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Bullet
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: TAX SLABS ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Percent className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Organisation Tax Settings</h2>
                  <p className="text-zinc-400 text-xs">
                    GST tax slabs configured for product pricing and sales orders
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">
                  Quick Add Standard GST Slabs
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { rate: 0, label: "0% Exempt" },
                    { rate: 5, label: "5% GST" },
                    { rate: 12, label: "12% GST" },
                    { rate: 28, label: "28% GST" },
                  ].map((p) => {
                    const isAdded = taxSlabs.some((s) => s.rate === p.rate);
                    return (
                      <button
                        key={p.rate}
                        type="button"
                        onClick={() => addPresetTaxSlab(p.rate, p.label)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isAdded
                            ? "bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-default"
                            : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-blue-500 hover:text-white"
                        }`}
                      >
                        {isAdded ? `✓ ${p.label}` : `+ ${p.label}`}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomTaxModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-all"
                  >
                    + Custom Slab
                  </button>
                </div>
              </div>

              {/* Custom Tax Modal */}
              {showCustomTaxModal && (
                <div className="p-4 bg-zinc-950/80 border border-blue-500/30 rounded-2xl space-y-3 animate-in fade-in">
                  <h4 className="text-white text-xs font-semibold">Add Custom GST Slab</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={customSlabName}
                      onChange={(e) => setCustomSlabName(e.target.value)}
                      placeholder="Slab Name (e.g. Gold 3%)"
                      className="bg-zinc-900 border-zinc-700 text-white rounded-xl h-9 text-xs"
                    />
                    <Input
                      type="number"
                      value={customSlabRate}
                      onChange={(e) => setCustomSlabRate(Number(e.target.value))}
                      placeholder="Total Rate % (e.g. 3)"
                      className="bg-zinc-900 border-zinc-700 text-white rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomTaxModal(false)}
                      className="text-xs text-zinc-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomTaxSlab}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl"
                    >
                      Add Slab
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Tax Slabs Cards */}
              <div className="space-y-2.5">
                <Label className="text-zinc-200 text-xs font-semibold uppercase tracking-wider block">
                  Configured Tax Slabs ({taxSlabs.length})
                </Label>
                <div className="grid grid-cols-1 gap-2.5">
                  {taxSlabs.map((slab) => (
                    <div
                      key={slab.id}
                      className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">
                            {slab.name}
                          </span>
                          {slab.isDefault && (
                            <span className="text-[10px] font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                              DEFAULT 18%
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-3 font-mono">
                          <span>Total: {slab.rate}%</span>
                          <span>•</span>
                          <span>CGST: {slab.cgstRate}%</span>
                          <span>•</span>
                          <span>SGST: {slab.sgstRate}%</span>
                          <span>•</span>
                          <span>IGST: {slab.igstRate}%</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTaxSlab(slab.id)}
                        disabled={taxSlabs.length <= 1}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: WAREHOUSES ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <WarehouseIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Warehouses & Locations</h2>
                    <p className="text-zinc-400 text-xs">
                      Manage inventory nodes. Defaults to Primary Warehouse; add more with custom names.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addWarehouse}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs gap-1.5 h-9"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Warehouse
                </Button>
              </div>

              <div className="space-y-4">
                {warehouses.map((wh, idx) => (
                  <div
                    key={wh.id}
                    className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-4 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-semibold text-sm">
                          Warehouse #{idx + 1}
                        </span>
                        {wh.isPrimary && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyBusinessAddressToWarehouse(idx)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Business Address
                        </button>
                        {!wh.isPrimary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWarehouse(idx)}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-zinc-300 text-xs">
                          Warehouse Name
                        </Label>
                        <Input
                          value={wh.name}
                          onChange={(e) =>
                            updateWarehouseField(idx, "name", e.target.value)
                          }
                          placeholder={wh.isPrimary ? "Primary Warehouse" : `Warehouse ${idx}`}
                          className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                        />
                        <p className="text-[10px] text-zinc-500">
                          If left blank, defaults to &ldquo;{wh.isPrimary ? "Primary Warehouse" : `Warehouse ${idx}`}&rdquo;.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-300 text-xs">
                          Location Code (Optional)
                        </Label>
                        <Input
                          value={wh.code}
                          onChange={(e) =>
                            updateWarehouseField(
                              idx,
                              "code",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder={wh.isPrimary ? "MAIN" : `WH-${idx}`}
                          className="bg-zinc-900 border-zinc-800 text-white font-mono uppercase rounded-xl h-10 text-sm"
                        />
                      </div>

                      {/* Optional address fields */}
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-zinc-400 text-xs">
                          Address (Optional)
                        </Label>
                        <Input
                          value={wh.addressLine1 || ""}
                          onChange={(e) =>
                            updateWarehouseField(idx, "addressLine1", e.target.value)
                          }
                          placeholder="Warehouse physical street address"
                          className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 5: REVIEW & PREVIEW ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Review & Verify All Details</h2>
                  <p className="text-zinc-400 text-xs">
                    Please inspect your settings carefully before launching your workspace
                  </p>
                </div>
              </div>

              {/* Section 1: Business Identity Preview */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-white font-semibold text-sm">Business Identity</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Display Name:</span>
                    <span className="text-zinc-200 font-semibold text-sm">{name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">GSTIN:</span>
                    <span className="text-teal-400 font-mono font-bold text-sm">{gstin}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Legal Entity:</span>
                    <span className="text-zinc-300">{legalName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Primary Phone:</span>
                    <span className="text-zinc-300 font-mono">{phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Team Email Domain:</span>
                    <span className="text-teal-400 font-mono text-xs">@{emailSuffix}.billos.app</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500 block">Registered Address:</span>
                    <span className="text-zinc-300">
                      {addressLine1}
                      {addressLine2 ? `, ${addressLine2}` : ""}, {city}, {stateName} - {pincode}
                    </span>
                  </div>
                  {website && (
                    <div>
                      <span className="text-zinc-500 block">Website:</span>
                      <span className="text-blue-400">{website}</span>
                    </div>
                  )}
                  {email && (
                    <div>
                      <span className="text-zinc-500 block">Email:</span>
                      <span className="text-zinc-300">{email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Invoicing & Bank Details Preview */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-teal-400" />
                    <h3 className="text-white font-semibold text-sm">Invoicing & Bank Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Invoice Prefix:</span>
                    <span className="text-zinc-300 font-mono">{invoicePrefix}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Date Format:</span>
                    <span className="text-zinc-300 font-mono">{dateFormat}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Timezone:</span>
                    <span className="text-zinc-300">{timezone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Bank Name:</span>
                    <span className="text-zinc-300">{bankName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Account Holder:</span>
                    <span className="text-zinc-300">{accountHolder || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Account Number:</span>
                    <span className="text-zinc-300 font-mono">{accountNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">IFSC Code:</span>
                    <span className="text-zinc-300 font-mono">{ifscCode || "—"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500 block">Invoice Bullet Terms ({invoiceTerms.length}):</span>
                    <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5 mt-1">
                      {invoiceTerms.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 3: Tax Slabs Preview */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-white font-semibold text-sm">Tax Slabs ({taxSlabs.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {taxSlabs.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span className="font-semibold text-white">{s.name}</span>
                      <span className="text-indigo-400 font-mono">({s.rate}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Warehouses Preview */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="w-4 h-4 text-amber-400" />
                    <h3 className="text-white font-semibold text-sm">Warehouses ({warehouses.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {warehouses.map((wh, idx) => {
                    const displayName =
                      wh.name.trim() || (wh.isPrimary ? "Primary Warehouse" : `Warehouse ${idx}`);
                    return (
                      <div
                        key={wh.id}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="text-white font-semibold block">{displayName}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            Code: {wh.code || (wh.isPrimary ? "MAIN" : `WH-${idx}`)}
                          </span>
                        </div>
                        {wh.isPrimary && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800/80">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLaunching}
                className="h-11 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-11 bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 px-6 gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleLaunchDashboard}
                disabled={isLaunching}
                className="h-12 bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-xl shadow-teal-500/20 px-8 gap-2 text-base transition-all duration-300 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 text-teal-200" />
                <span>Launch Dashboard</span>
              </Button>
            )}
          </div>
        </div>

        {/* Global Footer */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          billOS enterprise enterprise resource management • Built for Indian GST compliance
        </p>
      </div>
    </div>
  );
}
