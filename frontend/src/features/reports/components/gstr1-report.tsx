"use client";

import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GSTR-1 (Outward Supplies)</h2>
      </div>

      <div className="flex items-end gap-4 bg-muted/50 p-4 rounded-md border">
        <div className="space-y-1">
          <Label>Start Date</Label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div className="space-y-1">
          <Label>End Date</Label>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer GSTIN</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Taxable Value</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">IGST</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : data.map((row: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{row.customerGstin || "Unregistered"}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.invoiceNumber}</TableCell>
                <TableCell>{row.invoiceDate}</TableCell>
                <TableCell className="text-right">₹{row.taxableValue?.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.cgstAmount?.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.sgstAmount?.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.igstAmount?.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">₹{row.totalAmount?.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No outward supplies found in this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
