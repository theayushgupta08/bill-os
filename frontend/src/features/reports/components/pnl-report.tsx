"use client";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

export function PnlReport() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data: pnl, isLoading } = useQuery({
    queryKey: ["pnl", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const res = await api.get<any>(`/reports/pnl?${params.toString()}`);
      return res;
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profit & Loss</h2>
      </div>

      <div className="flex items-end gap-4 bg-muted/50 p-4 rounded-md border w-full md:max-w-md">
        <div className="space-y-1 flex-1">
          <Label>Start Date</Label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div className="space-y-1 flex-1">
          <Label>End Date</Label>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="pt-4">Loading P&L...</div>
      ) : pnl ? (
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{pnl.totalRevenue?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From Sales Invoices</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{pnl.totalPurchases?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From Purchase Bills</p>
            </CardContent>
          </Card>

          <Card className={pnl.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit / Loss</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pnl.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{pnl.netProfit?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue - Purchases</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="pt-4">Failed to load P&L data.</div>
      )}
    </div>
  );
}
