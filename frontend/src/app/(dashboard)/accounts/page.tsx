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
import { Plus, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Account {
  id: string;
  accountCode: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await fetchApi("/api/v1/accounts");
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await fetchApi(`/api/v1/accounts/${id}`, { method: "DELETE" });
      loadAccounts();
    } catch (error) {
      console.error("Failed to delete account", error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
        <div className="flex items-center space-x-2">
          <Link href="/accounts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No accounts found.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.accountCode}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{account.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/accounts/${account.id}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="destructive" size="icon" onClick={() => deleteAccount(account.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
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
