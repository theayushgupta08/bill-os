"use client";

import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

export function Gstr3bReport() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data, isLoading } = useQuery({
    queryKey: ["gstr3b", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await api.get<any>(`/reports/gstr3b?${params.toString()}`);
      return response as any;
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GSTR-3B (Summary)</h2>
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
        <div className="pt-4">Loading GSTR-3B...</div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
              <CardTitle className="text-lg font-bold text-blue-800">Outward Supplies (Sales)</CardTitle>
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Taxable Value</span>
                  <span className="font-medium text-lg">₹{data.outwardTaxableValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">CGST</span>
                  <span>₹{data.outwardCgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">SGST</span>
                  <span>₹{data.outwardSgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">IGST</span>
                  <span>₹{data.outwardIgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold pt-2 border-t">
                  <span>Total Tax Payable</span>
                  <span className="text-blue-700">₹{data.outwardTotalTax?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
              <CardTitle className="text-lg font-bold text-green-800">Inward Supplies (Purchases/ITC)</CardTitle>
              <ArrowDownRight className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Taxable Value</span>
                  <span className="font-medium text-lg">₹{data.inwardTaxableValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">CGST</span>
                  <span>₹{data.inwardCgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">SGST</span>
                  <span>₹{data.inwardSgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-muted">
                  <span className="text-muted-foreground">IGST</span>
                  <span>₹{data.inwardIgst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold pt-2 border-t">
                  <span>Total Input Tax Credit (ITC)</span>
                  <span className="text-green-700">₹{data.inwardTotalTax?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="pt-4">Failed to load GSTR-3B data.</div>
      )}
    </div>
  );
}
