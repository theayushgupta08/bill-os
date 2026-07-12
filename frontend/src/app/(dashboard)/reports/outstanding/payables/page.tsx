"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee } from "lucide-react";

export default function OutstandingPayablesPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data: any = await apiClient.get(`/reports/outstanding-payables`);
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to load outstanding payables", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalOutstanding = suppliers.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Outstanding Payables</h2>
      </div>

      <div className="bg-orange-50 border border-orange-200 text-orange-900 p-4 rounded-md flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Total Amount to Pay</h3>
          <p className="text-sm opacity-80">To all suppliers</p>
        </div>
        <div className="text-3xl font-bold flex items-center">
          <IndianRupee className="h-6 w-6 mr-1" />
          {totalOutstanding.toFixed(2)}
        </div>
      </div>

      <div className="rounded-md border bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Outstanding Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : suppliers.map((s, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.gstin || "N/A"}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell className="text-right font-bold text-orange-700">₹{s.outstandingBalance.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {!loading && suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No outstanding payables found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
