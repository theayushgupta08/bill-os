"use client";

import { useState } from 'react';
import {
  Mail,
  Shield,
  ShieldAlert,
  User,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Link2,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function InviteUserModal({ onRefresh }: { onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'USER',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastInvited, setLastInvited] = useState({ email: '', role: 'USER' });

  const resetState = () => {
    setIsSuccess(false);
    setInviteUrl('');
    setCopied(false);
    setFormData({ email: '', role: 'USER' });
    setLastInvited({ email: '', role: 'USER' });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post<{ message: string; token: string }>('/team/invite', formData);
      const token = res?.token;
      const url = token
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite?token=${token}`
        : '';

      setLastInvited({ email: formData.email, role: formData.role });
      setInviteUrl(url);
      setIsSuccess(true);
      toast.success('Invitation sent successfully!');
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleWhatsAppShare = () => {
    if (!inviteUrl) return;
    const text = `You've been invited to join our organization on billOS!\n\nClick the link below to accept the invitation and get started:\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge variant="outline" className="border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-semibold py-0.5">
            Owner
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold py-0.5">
            Admin
          </Badge>
        );
      case 'MANAGER':
        return (
          <Badge variant="outline" className="border-blue-500/25 bg-blue-500/10 text-blue-400 text-xs font-semibold py-0.5">
            Manager
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-500/25 bg-slate-500/10 text-slate-300 text-xs font-semibold py-0.5">
            User
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Mail className="mr-2 h-4 w-4" />
        Invite Member
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
        {!isSuccess ? (
          <>
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-white tracking-tight">
                Invite Team Member
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Send an email invitation to join your organization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Assign Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val ?? formData.role })}
                >
                  <SelectTrigger
                    id="role"
                    className="w-full h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500 focus:ring-blue-500/20"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[var(--anchor-width)] min-w-[340px] rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50"
                  >
                    <SelectItem value="USER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span>User (View & create records)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MANAGER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-blue-400 shrink-0" />
                        <span>Manager (Edit records, view reports)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Admin (Manage team, full access)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OWNER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>Owner (Unrestricted access)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/20"
                >
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <div className="space-y-5">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white tracking-tight">
                    Invitation Sent!
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
                    An email invitation has been dispatched. You can also share the direct link below.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Recipient details card */}
            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Invited Email</span>
                <span className="font-semibold text-white font-mono">{lastInvited.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Assigned Role</span>
                <div>{getRoleBadge(lastInvited.role)}</div>
              </div>
            </div>

            {/* Invitation link input and copy button */}
            {inviteUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Invitation Link
                  </Label>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400/80" /> Expires in 7 days
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={inviteUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="h-10 pr-9 rounded-xl bg-zinc-950 border-zinc-800 font-mono text-xs text-zinc-200 focus:border-blue-500 select-all cursor-pointer"
                    />
                    <Link2 className="absolute right-3 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      'h-10 px-4 rounded-xl font-medium transition-all shadow-md shrink-0 flex items-center gap-1.5',
                      copied
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Share Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsAppShare}
                    className="flex-1 h-9 rounded-xl border-zinc-800 bg-zinc-950/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-zinc-300 text-xs gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share via WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(inviteUrl, '_blank')}
                    className="h-9 px-3 rounded-xl border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:text-white text-zinc-300 text-xs gap-1.5 transition-colors"
                    title="Open invite link in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setInviteUrl('');
                  setCopied(false);
                  setFormData({ email: '', role: 'USER' });
                }}
                className="h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Invite Another
              </Button>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/20"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
