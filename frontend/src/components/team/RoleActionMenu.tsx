"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Shield,
  Trash2,
  ShieldAlert,
  UserX,
  UserCheck,
  User,
  Users,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
}

export function RoleActionMenu({
  member,
  onRefresh,
  currentUserRole,
  currentUserEmail,
}: {
  member: TeamMember;
  onRefresh: () => void;
  currentUserRole: string;
  currentUserEmail?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Permission checks
  const canModify = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isSelf = currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase();

  const hierarchy = ["OWNER", "ADMIN", "MANAGER", "USER", "VIEWER"];
  const callerLevel = hierarchy.indexOf(currentUserRole);
  const targetLevel = hierarchy.indexOf(member.role);

  const canToggle =
    canModify &&
    callerLevel !== -1 &&
    targetLevel !== -1 &&
    callerLevel < targetLevel &&
    !isSelf;

  const canResetPassword = canModify && !isSelf;

  const handleRoleChange = async (newRole: string) => {
    if (newRole === member.role) return;
    setLoading(true);
    try {
      await api.put(`/team/${member.userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const isActivating = member.status === "INACTIVE";
    const actionText = isActivating ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    setLoading(true);
    try {
      await api.put(`/team/${member.userId}/toggle-status`, { active: isActivating });
      toast.success(`User has been ${isActivating ? "activated" : "deactivated"} successfully`);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || `Failed to ${actionText} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const displayName = member.firstName ? `${member.firstName} ${member.lastName || ""}`.trim() : member.email;
    if (!confirm(`Are you sure you want to reset the password for ${displayName}? A new temporary password will be generated.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ newPassword: string }>(`/team/${member.userId}/reset-password`);
      setNewPassword(res.newPassword);
      setResetModalOpen(true);
      toast.success("Password reset successfully");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNewPassword = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      toast.success("New password copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this user from the organization?")) return;
    setLoading(true);
    try {
      await api.delete(`/team/${member.userId}`);
      toast.success("User removed from organization");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to remove user");
    } finally {
      setLoading(false);
    }
  };

  if (!canModify) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={loading} />}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[185px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleRoleChange("OWNER")} className="cursor-pointer">
              <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
              <span>Make Owner</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Make Admin</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("MANAGER")} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-blue-400" />
              <span>Make Manager</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("USER")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4 text-zinc-400" />
              <span>Make User</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {canResetPassword && (
              <DropdownMenuItem onClick={handleResetPassword} className="cursor-pointer text-amber-400 focus:text-amber-300">
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Reset Password</span>
              </DropdownMenuItem>
            )}

            {canToggle && (
              <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
                {member.status === "INACTIVE" ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>Activate User</span>
                  </>
                ) : (
                  <>
                    <UserX className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Deactivate User</span>
                  </>
                )}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleRemove}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Remove User</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Password Reset Modal */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Password Reset Complete
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              A new password has been generated for {member.firstName || member.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">User Account</span>
                <span className="font-mono text-white text-xs">{member.email}</span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">New Temporary Password</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      className="h-10 font-mono text-sm bg-zinc-900 border-zinc-800 text-zinc-100 select-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyNewPassword}
                    className={cn(
                      "h-10 px-3.5 rounded-xl text-xs font-medium shrink-0",
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Please copy and securely share this password with the staff member. They will be required to change it on their next login.
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
