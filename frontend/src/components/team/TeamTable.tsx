"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageLoader } from "@/components/ui/loader";
import { api } from "@/lib/api-client";
import { RoleActionMenu } from "./RoleActionMenu";
import { InviteUserModal } from "./InviteUserModal";
import { toast } from "sonner";
import {
  Users,
  Mail,
  Shield,
  ShieldAlert,
  Search,
  UserCheck,
  UserPlus,
  Filter,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string; // ACTIVE, INACTIVE, or INVITED
}

export function TeamTable() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data: any = await api.get("/team");
      setMembers(data);

      // Resolve current user's role from token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const email = payload.sub; // subject is email
          const currentMember = data.find((m: any) => m.email.toLowerCase() === email.toLowerCase());
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        } catch (e) {
          console.error("Failed to decode token for role resolution", e);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const getInitials = (member: TeamMember) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
    }
    return member.email.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "ADMIN":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/25 bg-rose-500/10 text-rose-400 font-semibold flex items-center gap-1 w-fit"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Owner
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1 w-fit"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/25 bg-blue-500/10 text-blue-400 font-semibold flex items-center gap-1 w-fit"
          >
            Manager
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-slate-500/25 bg-slate-500/10 text-slate-400 font-semibold flex items-center gap-1 w-fit"
          >
            User
          </Badge>
        );
    }
  };

  const filteredMembers = members.filter((member) => {
    const name = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
    const email = member.email.toLowerCase();
    const searchMatch =
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());

    const roleMatch = roleFilter === "ALL" || member.role === roleFilter;

    return searchMatch && roleMatch;
  });

  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = members.filter((m) => m.status === "INVITED").length;
  const inactiveCount = members.filter((m) => m.status === "INACTIVE").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Team
            </p>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active
            </p>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
          <div className="p-3 bg-rose-500/10 text-rose-450 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Inactive
            </p>
            <p className="text-2xl font-bold text-rose-400">{inactiveCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Invites
            </p>
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Team Management
          </h2>
          <p className="text-slate-400 text-sm">
            Manage your organization's members, assign roles, and toggle user active statuses.
          </p>
        </div>
        <div>
          <InviteUserModal onRefresh={fetchTeam} />
        </div>
      </div>

      {/* Table Filters & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-850 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-700/50">
            <TableRow>
              <TableHead className="text-slate-400 font-semibold pl-6">
                Name
              </TableHead>
              <TableHead className="text-slate-400 font-semibold">
                Email Address
              </TableHead>
              <TableHead className="text-slate-400 font-semibold">
                Access Role
              </TableHead>
              <TableHead className="text-slate-400 font-semibold">
                Status
              </TableHead>
              <TableHead className="w-[80px] text-right pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-slate-500"
                >
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No matching team members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member, i) => (
                <TableRow
                  key={member.userId || `invite-${i}`}
                  className="border-b border-slate-800/50 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={getAvatarBg(member.role)}>
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">
                          {member.firstName
                            ? `${member.firstName} ${member.lastName}`
                            : "Invited Member"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-xs">
                    {member.email}
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>
                    {member.status === "INVITED" ? (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                        Invited
                      </span>
                    ) : member.status === "INACTIVE" ? (
                      <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <RoleActionMenu
                      member={member}
                      onRefresh={fetchTeam}
                      currentUserRole={currentUserRole}
                    />
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
