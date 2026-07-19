"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

function Tooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1.5 align-middle cursor-help">
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-950 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-800 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 font-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
      </div>
    </div>
  );
}

export default function TaxRatesPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    try {
      const data: any = await api.get("/tax-rates");
      setTaxes(data);
    } catch (error) {
      console.error("Failed to load taxes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tax-rates", { name, rate: Number(rate), isActive: true });
      setName("");
      setRate("");
      loadTaxes();
    } catch (error) {
      console.error("Failed to add tax rate", error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-2">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-white">Tax Rates Master</h3>
        <p className="text-sm text-slate-400">Manage your organization's tax rates.</p>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-4 items-end mb-8 bg-slate-900/60 p-4 border border-slate-700/50 rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center">
            <label className="text-sm font-medium text-slate-300">Tax Name</label>
            <Tooltip text="The identifier name for this tax rate (e.g. GST 18%, VAT 5%)." />
          </div>
          <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. GST 18%" className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <label className="text-sm font-medium text-slate-300">Rate (%)</label>
            <Tooltip text="The exact decimal percentage rate of tax (e.g. 18.00)." />
          </div>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} required placeholder="18.00" className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20" />
        </div>
        <Button type="submit" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg font-medium">Add Tax Rate</Button>
      </form>
      
      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Tax Name</TableHead>
              <TableHead className="text-slate-400 font-semibold">Rate (%)</TableHead>
              <TableHead className="text-slate-400 font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                  No tax rates configured yet.
                </TableCell>
              </TableRow>
            ) : (
              taxes.map((t) => (
                <TableRow key={t.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-semibold text-white pl-6 py-4">{t.name}</TableCell>
                  <TableCell className="text-slate-300 font-mono text-sm">{t.rate}%</TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border border-slate-500/20 font-semibold">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
