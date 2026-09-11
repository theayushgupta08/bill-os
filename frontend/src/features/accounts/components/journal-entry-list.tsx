"use client";

import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from 'nuqs';

interface JournalEntry {
  id: string;
  entryDate: string;
  referenceNumber?: string;
  description: string;
  totalAmount: number;
  status?: string;
  lines?: unknown[];
}

export function JournalEntryList() {
  const [page] = useQueryState('page', { defaultValue: '1' });

  const { data: entries = [] as JournalEntry[], isLoading } = useQuery({
    queryKey: ["journal-entries", page],
    queryFn: async () => {
      // Changed fetchApi to apiClient.get for consistency
      const res = await api.get<JournalEntry[]>("/journal-entries");
      return res;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Journal Entries</h1>
        <Link href="/journal-entries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Lines</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading journal entries..." size="lg" />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No journal entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry: JournalEntry) => (
                <TableRow key={entry.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{entry.entryDate}</TableCell>
                  <TableCell>{entry.referenceNumber || "-"}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.lines?.length || 0}
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
