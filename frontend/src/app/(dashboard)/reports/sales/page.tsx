"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SalesRegisterPage() {
  const [data, setData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReport = () => {
    setLoading(true);
    let url = "/api/v1/reports/sales-register";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    apiClient(url, { method: "GET" })
      .then((res: any) => setData(res))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Register</h2>
      </div>

      <div className="flex space-x-2">
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Start Date" />
        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End Date" />
        <Button onClick={fetchReport} disabled={loading}>Filter</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell>{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell><Badge>{inv.status}</Badge></TableCell>
                <TableCell className="text-right">₹{inv.totalTax?.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{inv.totalAmount?.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center">No records found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
