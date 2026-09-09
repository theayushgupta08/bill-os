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
import { PageLoader } from "@/components/ui/loader";
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

  if (isLoading) return <PageLoader text="Loading journal entries..." />;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
        <div className="flex items-center space-x-2">
          <Link href="/journal-entries/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
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
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No journal entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry: JournalEntry) => (
                <TableRow key={entry.id}>
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
