"use client";

import { useState } from 'react';
import { Mail, Shield, ShieldAlert, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function InviteUserModal({ onRefresh }: { onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'USER'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/team/invite', formData);
      
      toast.success('Invitation sent successfully!');
      setOpen(false);
      setFormData({ email: '', role: 'USER' });
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button />
      }>
          <Mail className="mr-2 h-4 w-4" />
          Invite Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold text-white tracking-tight">Invite Team Member</DialogTitle>
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
              <SelectTrigger id="role" className="w-full h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500 focus:ring-blue-500/20">
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
              onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
