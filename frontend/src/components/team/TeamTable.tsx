"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
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
import { BrandLoader } from "@/components/ui/loader";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { RoleActionMenu } from "./RoleActionMenu";
import { AddMemberModal } from "./AddMemberModal";
import { PageHelpTooltip } from "@/components/ui/page-help-tooltip";
import { toast } from "sonner";
import {
  Users,
  User,
  Shield,
  ShieldAlert,
  Search,
  UserCheck,
  Filter,
  UserX,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TablePagination } from "@/components/ui/table-pagination";
import { useDataTable } from "@/hooks/use-data-table";

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string; // ACTIVE or INACTIVE
  lastActiveAt?: string;
  isCreator?: boolean;
}

export function TeamTable() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalCount: filteredCount,
    paginatedData: paginatedMembers,
  } = useDataTable<TeamMember>({
    data: members,
    searchFields: [
      (m) => `${m.firstName || ""} ${m.lastName || ""}`,
      "email",
    ],
    filterFn: (m) => {
      if (roleFilter === "ALL") return true;
      return m.role === roleFilter;
    },
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await api.get<TeamMember[]>("/team");
      setMembers(data);

      // Resolve current user's role from session
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
        try {
          const email = session.user.email;
          const currentMember = data.find(
            (m: { email: string; role: string }) =>
              m.email.toLowerCase() === email.toLowerCase()
          );
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        } catch (e) {
          console.error("Failed to decode session for role resolution", e);
        }
      }
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const canToggleStatus = (member: TeamMember) => {
    if (!member.userId || member.isCreator) return false;
    if (
      currentUserEmail &&
      member.email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      return false;
    }
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      return false;
    }
    const hierarchy = ["OWNER", "ADMIN", "MANAGER", "USER", "VIEWER"];
    const callerLevel = hierarchy.indexOf(currentUserRole);
    const targetLevel = hierarchy.indexOf(member.role);
    if (callerLevel === -1 || targetLevel === -1) return false;
    return callerLevel < targetLevel;
  };

  const handleToggleUserStatus = async (member: TeamMember) => {
    if (!canToggleStatus(member)) return;
    const isActivating = member.status === "INACTIVE";
    const actionText = isActivating ? "activate" : "deactivate";

    if (!isActivating) {
      const displayName = member.firstName
        ? `${member.firstName} ${member.lastName || ""}`.trim()
        : member.email;
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${displayName}?\n\nAll of their active sessions will be terminated immediately, and they will not be able to log in.`
      );
      if (!confirmed) return;
    }

    setTogglingUserId(member.userId);
    try {
      await api.put(`/team/${member.userId}/toggle-status`, {
        active: isActivating,
      });
      toast.success(
        isActivating
          ? `User ${member.email} has been activated`
          : `User ${member.email} has been deactivated and all sessions terminated`
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === member.userId
            ? { ...m, status: isActivating ? "ACTIVE" : "INACTIVE" }
            : m
        )
      );
      fetchTeam();
    } catch (err: unknown) {
      toast.error((err as Error).message || `Failed to ${actionText} user`);
    } finally {
      setTogglingUserId(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getRoleBadge = (role: string, isCreator?: boolean) => {
    if (isCreator) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="border-rose-500/25 bg-rose-500/10 text-rose-400 font-semibold flex items-center gap-1 w-fit"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Owner
          </Badge>
          <Badge
            variant="outline"
            title="Account that created the organisation. Must remain owner and cannot be deactivated or removed."
            className="border-amber-500/35 bg-amber-500/15 text-amber-300 font-semibold flex items-center gap-1 w-fit text-[11px] px-2 py-0.5 shadow-sm"
          >
            <span>👑</span>
            Creator
          </Badge>
        </div>
      );
    }

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

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Never";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return "Just now";
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "Never";
    }
  };

  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const inactiveCount = members.filter((m) => m.status === "INACTIVE").length;

  if (loading) {
    return (
      <BrandLoader
        size="lg"
        text="Loading team members..."
        variant="card"
        showBrandText
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
          Team Management
          <PageHelpTooltip
            title="Team & Access Control"
            description="Add staff members, manage role-based access permissions (Owner, Admin, Manager, User), and control account activity."
          />
        </h1>
        <AddMemberModal onRefresh={fetchTeam} />
      </div>

      {/* Top Banner / Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 p-4 rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Team
            </p>
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Members
            </p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inactive
            </p>
            <p className="text-2xl font-bold text-rose-400">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Table Filters & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 bg-slate-950/70 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val ?? "ALL")}
          >
            <SelectTrigger className="w-[150px] h-9 rounded-md bg-slate-950/70 border-border text-foreground text-sm focus:border-indigo-500">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="w-[180px] rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1 z-50 text-slate-200"
            >
              <SelectItem
                value="ALL"
                className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>All Roles</span>
                </div>
              </SelectItem>
              <SelectItem
                value="OWNER"
                className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>Owner</span>
                </div>
              </SelectItem>
              <SelectItem
                value="ADMIN"
                className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Admin</span>
                </div>
              </SelectItem>
              <SelectItem
                value="MANAGER"
                className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Manager</span>
                </div>
              </SelectItem>
              <SelectItem
                value="USER"
                className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>User</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table List */}
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Access Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Active/Inactive</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <BrandLoader
                    variant="card"
                    text="Loading team members..."
                    size="lg"
                  />
                </TableCell>
              </TableRow>
            ) : filteredCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No matching team members found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member) => (
                <TableRow
                  key={member.userId}
                  className="border-b border-slate-800/50 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={getAvatarBg(member.role)}>
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-sm">
                          {member.firstName
                            ? `${member.firstName} ${member.lastName || ""}`.trim()
                            : member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-xs">
                    {member.email}
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role, member.isCreator)}</TableCell>
                  <TableCell>
                    {member.status === "INACTIVE" ? (
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
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={member.status === "ACTIVE"}
                        disabled={
                          !canToggleStatus(member) ||
                          togglingUserId === member.userId
                        }
                        onClick={() => handleToggleUserStatus(member)}
                        title={
                          member.isCreator
                            ? "The organization creator cannot be deactivated"
                            : currentUserEmail &&
                              member.email.toLowerCase() ===
                                currentUserEmail.toLowerCase()
                            ? "You cannot deactivate your own account"
                            : !canToggleStatus(member)
                            ? "You do not have permission to change this user's status"
                            : member.status === "ACTIVE"
                            ? "Click to deactivate user (terminates all active sessions)"
                            : "Click to activate user"
                        }
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                          member.status === "ACTIVE"
                            ? "bg-emerald-500 hover:bg-emerald-400"
                            : "bg-zinc-700 hover:bg-zinc-600"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
                            member.status === "ACTIVE"
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-xs text-slate-300"
                        title={
                          member.lastActiveAt
                            ? new Date(member.lastActiveAt).toLocaleString()
                            : "No activity recorded"
                        }
                      >
                        {formatLastActive(member.lastActiveAt)}
                      </span>
                      {member.lastActiveAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(member.lastActiveAt))}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <RoleActionMenu
                      member={member}
                      onRefresh={fetchTeam}
                      currentUserRole={currentUserRole}
                      currentUserEmail={currentUserEmail}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          totalCount={filteredCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
