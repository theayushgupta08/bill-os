"use client";

import { useState } from 'react';
import { MoreHorizontal, Shield, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

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
  currentUserRole
}: { 
  member: TeamMember; 
  onRefresh: () => void;
  currentUserRole: string;
}) {
  const [loading, setLoading] = useState(false);

  const isPending = member.status === 'INVITED';
  
  // Basic UI protection (Backend enforces this too)
  const canModify = (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && !isPending;
  const isSelf = false; // We would need to pass currentUserId to properly check this

  const handleRoleChange = async (newRole: string) => {
    if (newRole === member.role) return;
    setLoading(true);
    try {
      await api.put(`/team/${member.userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;
    setLoading(true);
    try {
      await api.delete(`/team/${member.userId}`);
      toast.success('User removed from organization');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  if (!canModify) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading} />
      }>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleRoleChange('OWNER')} className="cursor-pointer">
          <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
          <span>Make Owner</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('ADMIN')} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4 text-emerald-500" />
          <span>Make Admin</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('MANAGER')} className="cursor-pointer">
          <span>Make Manager</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('USER')} className="cursor-pointer">
          <span>Make User</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleRemove} className="cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Remove User</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
