"use client";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownRight, ArrowUpRight, FileText, IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

interface GSTR3BData {
  totalSales: number;
  totalPurchases: number;
  outputTax: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  inputTaxCredit: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  taxPayable: {
    cgst: number;
    sgst: number;
    igst: number;
  };
}

export function Gstr3bReport() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data, isLoading } = useQuery({
    queryKey: ["gstr3b", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await api.get<GSTR3BData>(`/reports/gstr3b?${params.toString()}`);
      return response;
    }
  });

  const netGstPayable = data ? (data.outwardTotalTax || 0) - (data.inwardTotalTax || 0) : 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">GSTR-3B Summary</h2>
          <p className="text-sm text-slate-400">Monthly/quarterly summary of inward and outward supplies to compute final tax liability.</p>
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

        {/* Final Net Tax Payable summary box */}
        {data && (
          <div className={`p-3 border rounded-lg flex items-center gap-3 mt-4 md:mt-0 ${netGstPayable >= 0 ? "bg-amber-500/5 border-amber-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
            <div className={`p-2 rounded-lg ${netGstPayable >= 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{netGstPayable >= 0 ? "Net GST Liability" : "Net ITC Carryforward"}</p>
              <p className={`text-lg font-bold ${netGstPayable >= 0 ? "text-amber-450" : "text-emerald-400"}`}>
                ₹{Math.abs(netGstPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading GSTR-3B statement...</div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Outward Supplies */}
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-800/60">
              <CardTitle className="text-base font-bold text-indigo-400">Outward Supplies (Sales)</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total Taxable Value</span>
                  <span className="font-semibold text-white">₹{data.outwardTaxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="space-y-2.5 pl-4 border-l-2 border-slate-850">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">CGST (Outward)</span>
                    <span className="text-slate-300 font-mono">₹{data.outwardCgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">SGST (Outward)</span>
                    <span className="text-slate-300 font-mono">₹{data.outwardSgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">IGST (Outward)</span>
                    <span className="text-slate-300 font-mono">₹{data.outwardIgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold pt-3 border-t border-slate-800/60 text-sm text-indigo-400">
                  <span>Total Tax Payable</span>
                  <span className="font-mono text-base">₹{data.outwardTotalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Inward Supplies */}
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-800/60">
              <CardTitle className="text-base font-bold text-emerald-400">Inward Supplies (ITC)</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total Taxable Value</span>
                  <span className="font-semibold text-white">₹{data.inwardTaxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="space-y-2.5 pl-4 border-l-2 border-slate-850">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">CGST (Inward)</span>
                    <span className="text-slate-300 font-mono">₹{data.inwardCgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">SGST (Inward)</span>
                    <span className="text-slate-300 font-mono">₹{data.inwardSgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">IGST (Inward)</span>
                    <span className="text-slate-300 font-mono">₹{data.inwardIgst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold pt-3 border-t border-slate-800/60 text-sm text-emerald-400">
                  <span>Total Input Tax Credit</span>
                  <span className="font-mono text-base">₹{data.inwardTotalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400">Failed to load GSTR-3B data.</div>
      )}
    </div>
  );
}
