"use client";


import { useFormat } from "@/lib/use-format";
import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, errorMessage } from "@/lib/api-client";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BulkEntityType = "products" | "customers" | "categories";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: BulkEntityType;
  onSuccess?: () => void;
}

/** A spreadsheet row as parsed by XLSX with `raw: false` + `defval: ""`: every cell is its formatted text. */
type SheetRow = Record<string, string>;
/** A normalized row ready to POST to a bulk endpoint. */
type ImportRecord = Record<string, string | number | boolean | null | undefined>;

interface ParsedRow {
  rowNumber: number;
  raw: SheetRow;
  data: ImportRecord;
  isValid: boolean;
  errors: string[];
}

interface ImportSummary {
  totalCount: number;
  insertedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; identifier: string; reason: string }>;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  entity,
  onSuccess,
}: BulkImportDialogProps) {
  const { formatMoney } = useFormat();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "invalid">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration for each entity type
  const config = useMemo(() => {
    switch (entity) {
      case "products":
        return {
          title: "Import Products in Bulk",
          description:
            "Upload an Excel (.xlsx, .xls) or CSV file with product details, SKUs, base prices, and tax rates.",
          endpoint: "/products/bulk",
          sampleFileName: "billos_products_template",
          sampleHeaders: [
            "Name*",
            "SKU*",
            "Base Price*",
            "Tax Rate (%)",
            "HSN/SAC",
            "Unit of Measure",
            "Description",
          ],
          sampleRows: [
            {
              "Name*": "Logitech Wireless Mouse M185",
              "SKU*": "LOGI-M185-BLK",
              "Base Price*": 849.0,
              "Tax Rate (%)": 18,
              "HSN/SAC": "8471",
              "Unit of Measure": "PCS",
              "Description": "2.4GHz Wireless optical mouse with nano USB receiver",
            },
            {
              "Name*": "Mechanical Keyboard RGB",
              "SKU*": "KB-MECH-RGB-01",
              "Base Price*": 2499.0,
              "Tax Rate (%)": 18,
              "HSN/SAC": "8471",
              "Unit of Measure": "PCS",
              "Description": "Blue mechanical switches with customizable RGB backlight",
            },
          ],
          columnHeaders: ["Name", "SKU", "Base Price", "Tax Rate %", "Unit", "HSN/SAC"],
          normalizeRow: (raw: SheetRow): { data: ImportRecord; errors: string[] } => {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const found = Object.keys(raw).find(
                  (rk) => rk.trim().toLowerCase() === k.toLowerCase()
                );
                if (found && raw[found] !== undefined && raw[found] !== null && String(raw[found]).trim() !== "") {
                  return raw[found];
                }
              }
              return undefined;
            };

            const name = String(getVal(["name*", "name", "product name", "product_name"]) || "").trim();
            const sku = String(getVal(["sku*", "sku", "item code", "product code"]) || "").trim();
            const rawPrice = getVal(["base price*", "base price", "base_price", "price", "unit price"]);
            const rawTax = getVal(["tax rate (%)", "tax rate", "tax_rate", "gst", "tax"]);
            const hsnSac = String(getVal(["hsn/sac", "hsn", "sac", "hsn_sac"]) || "").trim();
            const unitOfMeasure = String(getVal(["unit of measure", "unit", "uom"]) || "PCS").trim();
            const description = String(getVal(["description", "desc", "details"]) || "").trim();

            const errors: string[] = [];
            if (!name) errors.push("Product Name is required");
            if (!sku) errors.push("SKU is required");

            const priceNum = rawPrice !== undefined ? Number(rawPrice) : NaN;
            if (rawPrice === undefined || isNaN(priceNum) || priceNum < 0) {
              errors.push("Valid positive Base Price is required");
            }

            const taxNum = rawTax !== undefined ? Number(rawTax) : 0;
            if (rawTax !== undefined && (isNaN(taxNum) || taxNum < 0 || taxNum > 100)) {
              errors.push("Tax rate must be between 0% and 100%");
            }

            return {
              data: {
                name,
                sku,
                basePrice: isNaN(priceNum) ? 0 : priceNum,
                taxRate: isNaN(taxNum) ? 0 : taxNum,
                hsnSac: hsnSac || null,
                unitOfMeasure: unitOfMeasure || "PCS",
                description: description || null,
                isShared: true,
              },
              errors,
            };
          },
        };

      case "customers":
        return {
          title: "Import Customers in Bulk",
          description:
            "Upload an Excel (.xlsx, .xls) or CSV file with customer names, phone numbers, GSTIN, and addresses.",
          endpoint: "/customers/bulk",
          sampleFileName: "billos_customers_template",
          sampleHeaders: [
            "Name*",
            "Phone*",
            "Email",
            "GSTIN",
            "PAN",
            "Billing Address",
            "City",
            "State",
            "Pincode",
          ],
          sampleRows: [
            {
              "Name*": "Apex Infotech Solutions Pvt Ltd",
              "Phone*": "9876543210",
              "Email": "accounts@apexinfo.com",
              "GSTIN": "27AAAAA0000A1Z5",
              "PAN": "AAAAA0000A",
              "Billing Address": "Floor 4, Cyber City, Phase 2",
              "City": "Mumbai",
              "State": "Maharashtra",
              "Pincode": "400001",
            },
            {
              "Name*": "Rajesh Sharma",
              "Phone*": "9820011223",
              "Email": "rajesh.sharma@example.com",
              "GSTIN": "",
              "PAN": "",
              "Billing Address": "12, Shanti Nagar, MG Road",
              "City": "Pune",
              "State": "Maharashtra",
              "Pincode": "411001",
            },
          ],
          columnHeaders: ["Name", "Phone", "Email", "GSTIN", "City", "State"],
          normalizeRow: (raw: SheetRow): { data: ImportRecord; errors: string[] } => {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const found = Object.keys(raw).find(
                  (rk) => rk.trim().toLowerCase() === k.toLowerCase()
                );
                if (found && raw[found] !== undefined && raw[found] !== null && String(raw[found]).trim() !== "") {
                  return raw[found];
                }
              }
              return undefined;
            };

            const name = String(getVal(["name*", "name", "customer name", "company name"]) || "").trim();
            const phone = String(getVal(["phone*", "phone", "mobile", "contact"]) || "").trim();
            const email = String(getVal(["email", "email address", "mail"]) || "").trim();
            const gstin = String(getVal(["gstin", "gst", "gst number"]) || "").trim();
            const pan = String(getVal(["pan", "pan number"]) || "").trim();
            const billingAddressLine1 = String(
              getVal(["billing address", "address", "address line 1"]) || ""
            ).trim();
            const billingCity = String(getVal(["city", "billing city"]) || "").trim();
            const billingState = String(getVal(["state", "billing state"]) || "").trim();
            const billingPincode = String(getVal(["pincode", "zip", "postal code"]) || "").trim();

            const errors: string[] = [];
            if (!name) errors.push("Customer Name is required");
            if (!phone) errors.push("Phone Number is required");

            return {
              data: {
                name,
                phone,
                email: email || null,
                gstin: gstin ? gstin.toUpperCase() : null,
                pan: pan ? pan.toUpperCase() : null,
                billingAddressLine1: billingAddressLine1 || null,
                billingCity: billingCity || null,
                billingState: billingState || null,
                billingPincode: billingPincode || null,
                billingCountry: "India",
                outstandingBalance: 0,
                isShared: true,
              },
              errors,
            };


          },
        };

      case "categories":
        return {
          title: "Import Product Categories in Bulk",
          description:
            "Upload an Excel (.xlsx, .xls) or CSV file with category names and descriptions.",
          endpoint: "/product-categories/bulk",
          sampleFileName: "billos_categories_template",
          sampleHeaders: ["Category Name*", "Description"],
          sampleRows: [
            {
              "Category Name*": "Computer Accessories",
              "Description": "Mice, Keyboards, USB Hubs, and peripheral accessories",
            },
            {
              "Category Name*": "Office Supplies",
              "Description": "Stationery, printer paper, notebooks, and binders",
            },
          ],
          columnHeaders: ["Category Name", "Description"],
          normalizeRow: (raw: SheetRow): { data: ImportRecord; errors: string[] } => {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const found = Object.keys(raw).find(
                  (rk) => rk.trim().toLowerCase() === k.toLowerCase()
                );
                if (found && raw[found] !== undefined && raw[found] !== null && String(raw[found]).trim() !== "") {
                  return raw[found];
                }
              }
              return undefined;
            };

            const name = String(getVal(["category name*", "category name", "name", "category"]) || "").trim();
            const description = String(getVal(["description", "desc", "details"]) || "").trim();

            const errors: string[] = [];
            if (!name) errors.push("Category Name is required");

            return {
              data: {
                name,
                description: description || null,
              },
              errors,
            };
          },
        };
    }
  }, [entity]);

  // Handle downloading sample template
  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    try {
      const ws = XLSX.utils.json_to_sheet(config.sampleRows, {
        header: config.sampleHeaders,
      });

      // Set nice column widths
      ws["!cols"] = config.sampleHeaders.map((h) => ({
        wch: Math.max(h.length + 4, 18),
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");

      const ext = format === "xlsx" ? "xlsx" : "csv";
      XLSX.writeFile(wb, `${config.sampleFileName}.${ext}`, {
        bookType: ext as XLSX.BookType,
      });
      toast.success(`Template ${config.sampleFileName}.${ext} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate sample template.");
    }
  };

  // Parse file (CSV or Excel)
  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setImportResult(null);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error("Uploaded workbook does not contain any sheets.");
        setIsParsing(false);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: SheetRow[] = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
        defval: "",
        raw: false,
      });

      if (!rawRows || rawRows.length === 0) {
        toast.error("No data rows found in the uploaded file.");
        setIsParsing(false);
        return;
      }

      const seenDuplicates = new Set<string>();
      const parsed: ParsedRow[] = rawRows.map((raw, idx) => {
        const rowNumber = idx + 2; // Row 1 is headers
        const { data, errors } = config.normalizeRow(raw);

        // Check duplicates inside the uploaded file
        if (entity === "products" && data.sku) {
          const lowerSku = String(data.sku).toLowerCase();
          if (seenDuplicates.has(lowerSku)) {
            errors.push(`Duplicate SKU '${data.sku}' within this file`);
          }
          seenDuplicates.add(lowerSku);
        } else if (entity === "customers" && data.phone) {
          const p = String(data.phone);
          if (seenDuplicates.has(p)) {
            errors.push(`Duplicate phone number '${data.phone}' within this file`);
          }
          seenDuplicates.add(p);
        } else if (entity === "categories" && data.name) {
          const lowerName = String(data.name).toLowerCase();
          if (seenDuplicates.has(lowerName)) {
            errors.push(`Duplicate category name '${data.name}' within this file`);
          }
          seenDuplicates.add(lowerName);
        }

        return {
          rowNumber,
          raw,
          data,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedRows(parsed);
      toast.info(`Parsed ${parsed.length} rows from ${uploadedFile.name}`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(`Error parsing file: ${errorMessage(err, "Invalid file format")}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const resetAll = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setFilterTab("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Metrics
  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter((r) => !r.isValid), [parsedRows]);

  const displayedRows = useMemo(() => {
    if (filterTab === "valid") return validRows;
    if (filterTab === "invalid") return invalidRows;
    return parsedRows;
  }, [filterTab, validRows, invalidRows, parsedRows]);

  // Submit valid rows to backend bulk endpoint
  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = validRows.map((r) => r.data);
      const res = await api.post<ImportSummary>(config.endpoint, payload);

      setImportResult(res);
      if (res.insertedCount > 0) {
        toast.success(`Successfully imported ${res.insertedCount} ${entity}!`);
        onSuccess?.();
      }

      if (res.skippedCount > 0) {
        toast.warning(
          `${res.skippedCount} items were skipped because they already exist in the database.`
        );
      }
    } catch (err: unknown) {
      console.error("Bulk import failed:", err);
      toast.error(errorMessage(err, `Failed to import ${entity}. Please check server logs.`));
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-slate-900 border border-slate-800 text-slate-100 max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {config.title}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {config.description}
                </DialogDescription>
              </div>
            </div>

            {/* Template Download Actions */}
            <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 pl-2 pr-1 hidden md:inline">
                Template:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate("xlsx")}
                className="h-8 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadTemplate("csv")}
                className="h-8 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                CSV (.csv)
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Step 1: File Dropzone (if no file parsed or on re-upload) */}
          {!parsedRows.length && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-emerald-950/10 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center min-h-[260px] space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/5">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <p className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Click to browse or drag & drop your spreadsheet here
                </p>
                <p className="text-xs text-slate-400 leading-normal">
                  Supports standard Excel (<span className="text-emerald-400 font-mono">.xlsx</span>, <span className="text-emerald-400 font-mono">.xls</span>) and CSV (<span className="text-emerald-400 font-mono">.csv</span>) files.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700/70 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tip: Download the sample template above to guarantee zero column mismatch
                </span>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isParsing && (
            <div className="py-14 text-center space-y-3">
              <Loader2 className="w-9 h-9 animate-spin text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Parsing and validating spreadsheet data...</p>
            </div>
          )}

          {/* Step 2: Parsed Preview and Validation Grid */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm">{file?.name}</span>
                    <span className="text-slate-400 ml-2 font-mono text-xs">({parsedRows.length} total rows)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Filter Tabs */}
                  <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFilterTab("all")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                        filterTab === "all"
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      All ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab("valid")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                        filterTab === "valid"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm"
                          : "text-emerald-400 hover:text-emerald-300"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid ({validRows.length})
                    </button>
                    {invalidRows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterTab("invalid")}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                          filterTab === "invalid"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm"
                            : "text-rose-400 hover:text-rose-300"
                        )}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Errors ({invalidRows.length})
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetAll}
                    className="h-8 text-xs text-slate-300 border-slate-700 bg-slate-800/80 hover:bg-slate-700"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Re-upload
                  </Button>
                </div>
              </div>

              {/* Status Note Banner */}
              {invalidRows.length > 0 && (
                <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-semibold">{invalidRows.length} row(s) contain validation errors and will be excluded.</span>{" "}
                    Only the <strong>{validRows.length} valid row(s)</strong> will be imported. Hover over the error badges in the table to inspect details.
                  </div>
                </div>
              )}

              {/* Import Results Box if finished */}
              {importResult && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>Import Completed Successfully</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center py-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-xs">Submitted</span>
                      <span className="font-mono font-bold text-white text-base">
                        {importResult.totalCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Inserted</span>
                      <span className="font-mono font-bold text-emerald-400 text-base">
                        {importResult.insertedCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Skipped (Duplicates)</span>
                      <span className="font-mono font-bold text-amber-400 text-base">
                        {importResult.skippedCount}
                      </span>
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-300">Skipped Item Details:</p>
                      <ul className="max-h-28 overflow-y-auto space-y-1 text-xs text-amber-300/90 pl-3 list-disc">
                        {importResult.errors.map((e, idx) => (
                          <li key={idx}>
                            Row {e.row} ({e.identifier}): {e.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Data Table */}
              <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 shadow-inner">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                    <TableRow className="border-b border-slate-800 text-xs">
                      <TableHead className="w-14 text-slate-400 font-semibold py-2.5">Row</TableHead>
                      <TableHead className="w-28 text-slate-400 font-semibold py-2.5">Status</TableHead>
                      {config.columnHeaders.map((col, idx) => (
                        <TableHead key={idx} className="text-slate-300 font-semibold py-2.5 whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {displayedRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={config.columnHeaders.length + 2}
                          className="text-center py-8 text-slate-500"
                        >
                          No rows match the selected filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedRows.map((row) => (
                        <TableRow
                          key={row.rowNumber}
                          className={cn(
                            "border-b border-slate-800/50 transition-colors",
                            !row.isValid ? "bg-rose-950/15 hover:bg-rose-950/25" : "hover:bg-white/5"
                          )}
                        >
                          <TableCell className="font-mono text-slate-500 py-2.5 text-[11px]">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell className="py-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </span>
                            ) : (
                              <span
                                title={row.errors.join("; ")}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium border border-rose-500/20 cursor-help"
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[120px]">{row.errors[0]}</span>
                              </span>
                            )}
                          </TableCell>
                          {entity === "products" && (
                            <>
                              <TableCell className="font-medium text-white py-2.5 whitespace-nowrap">
                                {row.data.name || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-slate-300 py-2.5 whitespace-nowrap">
                                {row.data.sku || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-white py-2.5 whitespace-nowrap">
                                {formatMoney(Number(row.data.basePrice || 0))}
                              </TableCell>
                              <TableCell className="text-slate-300 py-2.5 whitespace-nowrap">
                                {row.data.taxRate}%
                              </TableCell>
                              <TableCell className="text-slate-400 py-2.5 whitespace-nowrap">
                                {row.data.unitOfMeasure}
                              </TableCell>
                              <TableCell className="font-mono text-slate-400 py-2.5 text-[11px] whitespace-nowrap">
                                {row.data.hsnSac || "—"}
                              </TableCell>
                            </>
                          )}
                          {entity === "customers" && (
                            <>
                              <TableCell className="font-medium text-white py-2.5 whitespace-nowrap">
                                {row.data.name || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-slate-300 py-2.5 whitespace-nowrap">
                                {row.data.phone || "—"}
                              </TableCell>
                              <TableCell className="text-slate-300 py-2.5 whitespace-nowrap">
                                {row.data.email || "—"}
                              </TableCell>
                              <TableCell className="font-mono text-indigo-300 py-2.5 text-[11px] whitespace-nowrap">
                                {row.data.gstin || "—"}
                              </TableCell>
                              <TableCell className="text-slate-400 py-2.5 whitespace-nowrap">
                                {row.data.billingCity || "—"}
                              </TableCell>
                              <TableCell className="text-slate-400 py-2.5 whitespace-nowrap">
                                {row.data.billingState || "—"}
                              </TableCell>
                            </>
                          )}
                          {entity === "categories" && (
                            <>
                              <TableCell className="font-medium text-white py-2.5 whitespace-nowrap">
                                {row.data.name || "—"}
                              </TableCell>
                              <TableCell className="text-slate-400 py-2.5">
                                {row.data.description || "—"}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between sm:justify-between w-full shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {importResult ? "Close" : "Cancel"}
          </Button>

          <div className="flex items-center gap-3">
            {parsedRows.length > 0 && !importResult && (
              <Button
                type="button"
                disabled={validRows.length === 0 || isSubmitting}
                onClick={handleImport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 h-9 shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Importing Records...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Import {validRows.length} Valid Records
                  </>
                )}
              </Button>
            )}
            {importResult && (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 h-9 shadow-lg shadow-emerald-600/20"
              >
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
