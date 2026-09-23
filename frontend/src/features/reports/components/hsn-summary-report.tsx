"use client";

import { useFormat } from "@/lib/use-format";
import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Download, Hash } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export interface HsnSummaryRow {
  hsnSac: string;
  description?: string;
  uqc?: string;
  taxRate: number;
  totalQuantity: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalValue: number;
}

const UNSPECIFIED = "UNSPECIFIED";
const AMOUNT_KEYS = ["taxableValue", "cgstAmount", "sgstAmount", "igstAmount", "totalTax", "totalValue"] as const;

function csvCell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV with plain numbers (no currency symbols or grouping) so it imports cleanly into the GST offline tool. */
function toCsv(rows: HsnSummaryRow[]): string {
  const header = ["HSN/SAC", "Description", "UQC", "Rate (%)", "Total Quantity", "Taxable Value", "CGST", "SGST", "IGST", "Total Tax", "Total Value"];
  const lines = rows.map((r) =>
    [
      r.hsnSac,
      r.description,
      r.uqc,
      r.taxRate,
      r.totalQuantity,
      ...AMOUNT_KEYS.map((k) => Number(r[k]).toFixed(2)),
    ]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export function HsnSummaryReport() {
  const { formatMoney, formatNumber } = useFormat();
  const [startDate, setStartDate] = useQueryState("startDate", { defaultValue: "" });
  const [endDate, setEndDate] = useQueryState("endDate", { defaultValue: "" });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["hsn-summary", startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api.get<HsnSummaryRow[]>(`/reports/gst/hsn-summary?${params.toString()}`);
    },
  });

  const totals = AMOUNT_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: rows.reduce((sum, r) => sum + Number(r[key] || 0), 0) }),
    {} as Record<(typeof AMOUNT_KEYS)[number], number>
  );
  const missingHsn = rows.some((r) => r.hsnSac === UNSPECIFIED);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hsn-summary${startDate ? `-${startDate}` : ""}${endDate ? `-to-${endDate}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Hash className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            HSN Summary
            <PageHelpTooltip
              title="HSN-wise Summary"
              description="Outward supplies grouped by HSN/SAC code and tax rate, as required in GSTR-1 (Table 12). Only issued invoices are included — drafts and voided invoices are excluded."
            />
          </h2>
          <p className="text-sm text-slate-400">HSN/SAC-wise summary of outward supplies for GSTR-1.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between bg-slate-900/60 p-4 border border-slate-700/50 rounded-xl">
        <div className="flex items-end gap-3 flex-1 max-w-md">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>
        </div>
        <Button variant="outline" onClick={downloadCsv} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>
      </div>

      {missingHsn && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          Some sold products have no HSN/SAC code and are listed as UNSPECIFIED. Add codes to those products before filing GSTR-1.
        </p>
      )}

      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">HSN/SAC</TableHead>
              <TableHead className="text-slate-400 font-semibold">Description</TableHead>
              <TableHead className="text-slate-400 font-semibold">UQC</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right">Rate</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right">Qty</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right">Taxable Value</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right">CGST</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right">SGST</TableHead>
              <TableHead className="text-slate-400 font-semibold text-right pr-6">IGST</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center">
                  <BrandLoader variant="card" text="Building HSN summary..." size="lg" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-slate-400">
                  No issued invoices in this period.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={`${r.hsnSac}-${r.taxRate}`} className="border-b border-slate-800/50">
                  <TableCell className={`pl-6 font-mono text-xs ${r.hsnSac === UNSPECIFIED ? "text-amber-400" : "text-white"}`}>{r.hsnSac}</TableCell>
                  <TableCell className="text-slate-300 text-sm">{r.description || "—"}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{r.uqc || "—"}</TableCell>
                  <TableCell className="text-right text-slate-300">{formatNumber(r.taxRate)}%</TableCell>
                  <TableCell className="text-right text-slate-300">{formatNumber(r.totalQuantity)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-white">{formatMoney(r.taxableValue)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300">{formatMoney(r.cgstAmount)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300">{formatMoney(r.sgstAmount)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300 pr-6">{formatMoney(r.igstAmount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter className="bg-slate-950/60">
              <TableRow>
                <TableCell colSpan={5} className="pl-6 font-semibold text-white">Total</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold text-white">{formatMoney(totals.taxableValue)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-200">{formatMoney(totals.cgstAmount)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-200">{formatMoney(totals.sgstAmount)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-200 pr-6">{formatMoney(totals.igstAmount)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
