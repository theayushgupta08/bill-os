"use client";

import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { Badge } from "@/components/ui/badge";
import { Building2, IndianRupee } from "lucide-react";

export function Gstr1Report() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data = [] as any[], isLoading } = useQuery({
    queryKey: ["gstr1", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await api.get<any>(`/reports/gstr1?${params.toString()}`);
      return response as any[];
    }
  });

  const totals = data.reduce(
    (acc, row) => {
      acc.taxable += row.taxableValue || 0;
      acc.cgst += row.cgstAmount || 0;
      acc.sgst += row.sgstAmount || 0;
      acc.igst += row.igstAmount || 0;
      acc.total += row.totalAmount || 0;
      return acc;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">GSTR-1 Outward Supplies</h2>
          <p className="text-sm text-slate-400">Statement of outward supplies of goods or services for filing monthly/quarterly GST returns.</p>
        </div>
      </div>

      {/* Date Filter & Summary Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-slate-900/60 p-4 border border-slate-700/50 rounded-xl">
        <div className="flex items-end gap-3 flex-1 max-w-md">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-slate-850 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</Label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-slate-850 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* GST Payable Box */}
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-center gap-3 mt-4 md:mt-0">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Outward GST</p>
            <p className="text-lg font-bold text-white">
              ₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Customer GSTIN</TableHead>
              <TableHead className="text-slate-400 font-semibold">Customer Name</TableHead>
              <TableHead className="text-slate-400 font-semibold">Invoice #</TableHead>
              <TableHead className="text-slate-400 font-semibold">Date</TableHead>
              <TableHead className="text-right text-slate-400 font-semibold">Taxable Value</TableHead>
              <TableHead className="text-right text-slate-400 font-semibold">CGST</TableHead>
              <TableHead className="text-right text-slate-400 font-semibold">SGST</TableHead>
              <TableHead className="text-right text-slate-400 font-semibold">IGST</TableHead>
              <TableHead className="text-right pr-6 text-slate-400 font-semibold">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-slate-500">Loading GSTR-1 entries...</TableCell>
              </TableRow>
            ) : data.map((row: any, idx: number) => (
              <TableRow key={idx} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="font-semibold text-white pl-6 py-4">
                  {row.customerGstin ? (
                    <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-semibold font-mono text-xs">
                      {row.customerGstin}
                    </Badge>
                  ) : (
                    <span className="text-slate-500 text-xs italic">Unregistered</span>
                  )}
                </TableCell>
                <TableCell className="text-white text-sm font-medium">{row.customerName}</TableCell>
                <TableCell className="text-slate-300 font-mono text-xs">{row.invoiceNumber}</TableCell>
                <TableCell className="text-slate-350 text-xs font-mono">{row.invoiceDate}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-300">₹{row.taxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-350">₹{row.cgstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-350">₹{row.sgstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-350">₹{row.igstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right pr-6 font-mono text-sm font-semibold text-white">₹{row.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                  No outward supplies recorded for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
