"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api-client";
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

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await fetchApi("/api/v1/journal-entries");
      setEntries(data);
    } catch (error) {
      console.error("Failed to load journal entries", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

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
                <TableCell colSpan={5} className="text-center">
                  No journal entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
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
