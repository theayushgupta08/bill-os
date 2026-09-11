"use client";

import Link from "next/link";
import { api, downloadPdf } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loader";
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

  if (isLoading) return <PageLoader text="Loading quotations..." />;

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Quotations</h1>
        <div className="flex items-center space-x-2">
          <Link href="/sales/quotes/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Quote</Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
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
            {quotes.map((q: any) => (
              <TableRow key={q.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
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
