"use client";

import Link from "next/link";
import { api, downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';
import { Quotation } from "@/types";

export function QuoteList() {
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotations", page],
    queryFn: async () => {
      const res = await api.get<Quotation[]>("/quotations");
      return res;
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
        <div className="flex items-center space-x-2">
          <Link href="/sales/quotes/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Quote</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q: Quotation) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quoteNumber}</TableCell>
                <TableCell>{q.quoteDate}</TableCell>
                <TableCell>{q.customerName}</TableCell>
                <TableCell><Badge>{q.status}</Badge></TableCell>
                <TableCell className="text-right">₹{q.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(`/quotations/${q.id}/pdf`, `Quote-${q.quoteNumber}.pdf`)}>
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {quotes.length === 0 && (
               <TableRow><TableCell colSpan={6} className="text-center h-24">No quotations found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
