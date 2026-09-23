"use client";


import { useFormat } from "@/lib/use-format";
import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Activity, Terminal } from "lucide-react";
import { BrandLoader } from "@/components/ui/loader";

interface AuditLogRecord {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  userName?: string;
  userId: string;
  details?: string;
}

import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";

export function AuditLogsReport() {
  const { formatDateTime } = useFormat();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await api.get<AuditLogRecord[]>("/audit-logs");
      return res;
    }
  });

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">CREATE</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/25">UPDATE</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/25">DELETE</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/25">{action}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            System Audit Logs
            <PageHelpTooltip
              title="System Audit Logs"
              description="Chronological record of sensitive actions, user logins, entity updates, and deletions across the organization."
            />
          </h2>
          <p className="text-sm text-slate-400">Track all create, update, and delete actions performed in your organization.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl mt-4">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">Timestamp</TableHead>
              <TableHead className="text-slate-400 font-semibold">Action</TableHead>
              <TableHead className="text-slate-400 font-semibold">Entity Type</TableHead>
              <TableHead className="text-slate-400 font-semibold">User</TableHead>
              <TableHead className="text-slate-400 font-semibold pr-6">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <BrandLoader variant="card" text="Loading system logs..." size="lg" />
                </TableCell>
              </TableRow>
            ) : logs.map((log: AuditLogRecord) => (
              <TableRow key={log.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                <TableCell className="text-slate-300 font-mono text-xs pl-6 py-4">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell>
                  {getActionBadge(log.action)}
                </TableCell>
                <TableCell className="font-semibold text-white">{log.entityType}</TableCell>
                <TableCell className="text-slate-300 text-sm">{log.userName || log.userId}</TableCell>
                <TableCell className="text-slate-400 text-xs truncate max-w-xs pr-6" title={log.details}>
                  {log.details || "—"}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No audit logs recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
