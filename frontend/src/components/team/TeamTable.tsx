"use client";

import { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/loader';
import { api } from '@/lib/api-client';
import { RoleActionMenu } from './RoleActionMenu';
import { InviteUserModal } from './InviteUserModal';
import { toast } from 'sonner';

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
}

export function TeamTable() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Note: For a robust MVP, you'd normally extract currentUserRole from your auth context.
  // Here we assume if they can see this page, we'll let the backend block unauthorized actions.
  // We'll pass 'ADMIN' just to enable the UI dropdown for demonstration, 
  // but in reality, you should fetch the /api/v1/auth/me to get the actual role.
  const currentUserRole = 'ADMIN'; 

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data: any = await api.get('/team');
      setMembers(data);
    } catch (err: any) {
      toast.error('Failed to load team members');
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
    return member.email.charAt(0).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER': return <Badge variant="destructive">Owner</Badge>;
      case 'ADMIN': return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Admin</Badge>;
      case 'MANAGER': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Manager</Badge>;
      default: return <Badge variant="outline">User</Badge>;
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization's members and their access levels.
          </p>
        </div>
        <InviteUserModal onRefresh={fetchTeam} />
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member, i) => (
                <TableRow key={member.userId || `invite-${i}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-100 text-xs">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{member.firstName ? `${member.firstName} ${member.lastName}` : 'Pending User'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600">{member.email}</TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>
                    {member.status === 'INVITED' ? (
                      <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                        Pending Invite
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
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
