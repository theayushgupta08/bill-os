"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Account {
  id: string;
  accountCode: string;
  name: string;
}

interface JournalLine {
  id: string;
  accountId: string;
  debitAmount: number | string;
  creditAmount: number | string;
  description: string;
}

export function JournalEntryForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    referenceNumber: "",
    description: "",
  });

  const [lines, setLines] = useState([
    { id: "1", accountId: "", debitAmount: 0, creditAmount: 0, description: "" },
    { id: "2", accountId: "", debitAmount: 0, creditAmount: 0, description: "" },
  ]);

  const { data: accounts = [] as Account[], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get<Account[]>("/accounts");
      return res;
    }
  });

  const totalDebits = lines.reduce((sum, line) => sum + (Number(line.debitAmount) || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (Number(line.creditAmount) || 0), 0);
  const isBalanced = totalDebits === totalCredits && totalDebits > 0;

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post("/journal-entries", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal entry saved successfully!");
      router.push("/journal-entries");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to save journal entry", error);
      toast.error("Failed to save journal entry. Please check console.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("Debits must equal Credits to post an entry!");
      return;
    }

    const payload = {
      ...formData,
      lines: lines.filter((l: JournalLine) => l.accountId !== "").map(l => ({
        accountId: l.accountId,
        debitAmount: Number(l.debitAmount) || 0,
        creditAmount: Number(l.creditAmount) || 0,
        description: l.description
      }))
    };

    createMutation.mutate(payload);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: "", debitAmount: 0, creditAmount: 0, description: "" }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter((l: JournalLine) => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: string | number) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'debitAmount' && Number(value) > 0) updated.creditAmount = 0;
        if (field === 'creditAmount' && Number(value) > 0) updated.debitAmount = 0;
        return updated;
      }
      return l;
    }));
  };

  if (loadingAccounts) return <div className="p-8">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entryDate">Entry Date *</Label>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            value={formData.entryDate}
            onChange={handleHeaderChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Reference #</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleHeaderChange}
            placeholder="e.g. INV-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Memo / Description *</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleHeaderChange}
            required
          />
        </div>
      </div>

      <div className="rounded-md border mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Account</TableHead>
              <TableHead className="w-[30%]">Description</TableHead>
              <TableHead className="text-right w-[15%]">Debit</TableHead>
              <TableHead className="text-right w-[15%]">Credit</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line: JournalLine) => (
              <TableRow key={line.id}>
                <TableCell>
                  <Select 
                    value={line.accountId} 
                    onValueChange={(val: string | null) => val && updateLine(line.id, 'accountId', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc: Account) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.accountCode} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    placeholder="Line memo"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="text-right"
                    value={line.debitAmount || ""}
                    onChange={(e) => updateLine(line.id, 'debitAmount', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="text-right"
                    value={line.creditAmount || ""}
                    onChange={(e) => updateLine(line.id, 'creditAmount', e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-2 border-t">
          <Button type="button" variant="ghost" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" /> Add Line
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <div className="w-64 space-y-2 text-right">
          <div className="flex justify-between font-medium">
            <span>Total Debits:</span>
            <span>₹{totalDebits.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Credits:</span>
            <span>₹{totalCredits.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            <span>Difference:</span>
            <span>₹{Math.abs(totalDebits - totalCredits).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => router.push("/journal-entries")}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || !isBalanced}>
          {createMutation.isPending ? "Posting..." : "Post Entry"}
        </Button>
      </div>
    </form>
  );
}
