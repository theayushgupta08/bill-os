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
import { InviteUserModal } from "./InviteUserModal";
import { toast } from "sonner";
import {
  Users,
  User,
  Mail,
  Shield,
  ShieldAlert,
  Search,
  UserCheck,
  UserPlus,
  Filter,
  UserX,
  Copy,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string; // ACTIVE, INACTIVE, or INVITED
  inviteToken?: string;
  invitationId?: string;
}

export function TeamTable() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingInviteEmail, setDeletingInviteEmail] = useState<string | null>(null);

  const handleCopyInvite = async (token: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      toast.error("Failed to copy invitation link");
    }
  };

  const handleDeleteInvite = async (member: TeamMember) => {
    if (!window.confirm(`Are you sure you want to cancel and delete the invitation for ${member.email}?`)) {
      return;
    }

    setDeletingInviteEmail(member.email);
    try {
      if (member.invitationId) {
        await api.delete(`/team/invite/${member.invitationId}`);
      } else if (member.userId) {
        try {
          await api.delete(`/team/invite/${member.userId}`);
        } catch {
          await api.delete(`/team/invite?email=${encodeURIComponent(member.email)}`);
        }
      } else {
        await api.delete(`/team/invite?email=${encodeURIComponent(member.email)}`);
      }
      toast.success(`Invitation for ${member.email} deleted successfully`);
      fetchTeam();
    } catch (err: unknown) {
      try {
        await api.delete(`/team/invite?email=${encodeURIComponent(member.email)}`);
        toast.success(`Invitation for ${member.email} deleted successfully`);
        fetchTeam();
      } catch (fallbackErr: unknown) {
        toast.error((err as Error).message || "Failed to delete invitation");
      }
    } finally {
      setDeletingInviteEmail(null);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await api.get<TeamMember[]>("/team");
      setMembers(data);

      // Resolve current user's role from session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
        try {
          const email = session.user.email;
          const currentMember = data.find((m: {email: string; role: string}) => m.email.toLowerCase() === email.toLowerCase());
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
    if (!member.userId || member.status === "INVITED") return false;
    if (currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase()) {
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
      await api.put(`/team/${member.userId}/toggle-status`, { active: isActivating });
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
      <BrandLoader size="lg" text="Loading team members..." variant="card" showBrandText />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Team Management</h2>
            <p className="text-sm text-slate-400">Manage your organization team members, roles, and access status.</p>
          </div>
        </div>
        <div>
          <InviteUserModal onRefresh={fetchTeam} />
        </div>
      </div>

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
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val ?? "ALL")}>
            <SelectTrigger className="w-[150px] h-9 rounded-xl bg-slate-850 border-slate-700 text-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500/20">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="w-[180px] rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1 z-50 text-slate-200"
            >
              <SelectItem value="ALL" className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>All Roles</span>
                </div>
              </SelectItem>
              <SelectItem value="OWNER" className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>Owner</span>
                </div>
              </SelectItem>
              <SelectItem value="ADMIN" className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Admin</span>
                </div>
              </SelectItem>
              <SelectItem value="MANAGER" className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Manager</span>
                </div>
              </SelectItem>
              <SelectItem value="USER" className="rounded-lg py-2 px-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-64 text-center"
                >
                  <BrandLoader variant="card" text="Loading team members..." size="lg" />
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
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
                    <div className="flex items-center gap-3">
                      {member.status === "INVITED" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                            Invited
                          </span>
                          {member.inviteToken && (
                            <button
                              type="button"
                              onClick={() => handleCopyInvite(member.inviteToken!)}
                              title="Copy invitation link to clipboard"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 px-2 py-0.5 rounded-md transition-all border border-zinc-700/60 shadow-xs cursor-pointer"
                            >
                              {copiedToken === member.inviteToken ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          )}
                          {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteInvite(member)}
                              disabled={deletingInviteEmail === member.email}
                              title="Delete invitation"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2 py-0.5 rounded-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {deletingInviteEmail === member.email ? (
                                <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-3 h-3 text-rose-400" />
                              )}
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={member.status === "ACTIVE"}
                            disabled={!canToggleStatus(member) || togglingUserId === member.userId}
                            onClick={() => handleToggleUserStatus(member)}
                            title={
                              currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase()
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
                                member.status === "ACTIVE" ? "translate-x-4" : "translate-x-0.5"
                              )}
                            />
                          </button>

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
                        </>
                      )}
                    </div>
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
