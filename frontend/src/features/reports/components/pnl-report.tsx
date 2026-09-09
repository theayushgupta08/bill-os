"use client";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

interface PnLData {
  totalRevenue: number;
  totalPurchases: number;
  netProfit: number;
}

export function PnlReport() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data: pnl, isLoading } = useQuery({
    queryKey: ["pnl", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const res = await api.get<PnLData>(`/reports/pnl?${params.toString()}`);
      return res;
    }
  });

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Profit & Loss Statement</h2>
          <p className="text-sm text-slate-400">Summarized snapshot of organization revenues, purchases, and net margins.</p>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end bg-slate-900/60 p-4 border border-slate-700/50 rounded-xl max-w-xl">
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
      
      {isLoading ? (
        <BrandLoader variant="card" text="Loading Profit & Loss statement..." size="lg" />
      ) : pnl ? (
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                ₹{pnl.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">From sales invoices & receipts</p>
            </CardContent>
          </Card>
          
          <Card className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Purchases</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-2xl font-bold text-rose-400 tracking-tight">
                ₹{pnl.totalPurchases?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">From supplier purchase bills</p>
            </CardContent>
          </Card>

          <Card className={`border shadow-xl hover:shadow-2xl transition-all duration-200 ${pnl.netProfit >= 0 ? "border-emerald-500/30 bg-emerald-950/10" : "border-rose-500/30 bg-rose-950/10"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Profit / Loss</CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pnl.netProfit >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                <IndianRupee className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className={`text-2xl font-bold tracking-tight ${pnl.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ₹{pnl.netProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total revenue minus purchases</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400">Failed to load P&L statement.</div>
      )}
    </div>
  );
}
