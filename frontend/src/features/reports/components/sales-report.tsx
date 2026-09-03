"use client";

import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { FileText, IndianRupee } from "lucide-react";
import { Invoice } from "@/types";

export function SalesReport() {
  const [startDate, setStartDate] = useQueryState('startDate', { defaultValue: '' });
  const [endDate, setEndDate] = useQueryState('endDate', { defaultValue: '' });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["sales-register", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const res = await api.get<Invoice[]>(`/reports/sales-register?${params.toString()}`);
      return res;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">PAID</Badge>;
      case "UNPAID":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 font-semibold">UNPAID</Badge>;
      case "OVERDUE":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/25 font-semibold">OVERDUE</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/25 font-semibold">{status}</Badge>;
    }
  };

  const totalAmount = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sales Register</h2>
          <p className="text-sm text-slate-400">Detailed register of sales invoices generated within the selected timeframe.</p>
        </div>
      </div>

      {/* Summary Box & Date Filters */}
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
        
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-center gap-3 mt-4 md:mt-0">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Registered Sales</p>
            <p className="text-lg font-bold text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Invoice Date</TableHead>
              <TableHead className="text-slate-400 font-semibold">Invoice Number</TableHead>
              <TableHead className="text-slate-400 font-semibold">Customer</TableHead>
              <TableHead className="text-slate-400 font-semibold">Status</TableHead>
              <TableHead className="text-right pr-6 text-slate-400 font-semibold">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading invoice entries...</TableCell>
              </TableRow>
            ) : invoices.map((inv: any) => (
              <TableRow key={inv.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="text-slate-300 font-mono text-xs pl-6 py-4">{inv.invoiceDate}</TableCell>
                <TableCell className="font-semibold text-white">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-slate-300 text-sm">{inv.customerName}</TableCell>
                <TableCell>
                  {getStatusBadge(inv.status)}
                </TableCell>
                <TableCell className="text-right pr-6 font-mono text-sm font-semibold text-white">
                  ₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No invoice entries found in this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
