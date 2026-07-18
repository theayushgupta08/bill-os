"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Tax Rates Master</h3>
        <p className="text-sm text-muted-foreground">Manage your organization's tax rates.</p>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-4 items-end mb-8">
        <div>
          <label className="text-sm font-medium">Tax Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. GST 18%" />
        </div>
        <div>
          <label className="text-sm font-medium">Rate (%)</label>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} required placeholder="18.00" />
        </div>
        <Button type="submit">Add Tax Rate</Button>
      </form>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax Name</TableHead>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.rate}%</TableCell>
                <TableCell>
                  {t.isActive ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
