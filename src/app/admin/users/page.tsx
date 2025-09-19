
'use client'

import { getAllUsers } from '@/services/users';
import UsersAdminClient from './client';
import { getCurrentUser } from '@/services/auth';
import { useEffect, useState } from 'react';
import { AuthenticatedUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createSampleUser } from '@/app/dev/setup/actions';
import { Plan, UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [invitePlan, setInvitePlan] = useState<Plan>('free');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [usersData, currentUserData] = await Promise.all([
        getAllUsers(),
        getCurrentUser()
      ]);
      setUsers(usersData);
      setCurrentUser(currentUserData);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const result = await createSampleUser({ 
        email: inviteEmail, 
        role: inviteRole,
        plan: invitePlan
      });
      
      if (result.success) {
        toast({ title: 'User Invited', description: result.message });
        const newUsers = await getAllUsers();
        setUsers(newUsers);
        setIsInviteOpen(false);
        setInviteEmail('');
      } else {
        toast({ variant: 'destructive', title: 'Invite Failed', description: result.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsInviting(false);
    }
  };
  
  if (isLoading) {
      return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <Button onClick={() => setIsInviteOpen(prev => !prev)}>
            {isInviteOpen ? 'Cancel' : 'Invite User'}
        </Button>
      </div>

      {isInviteOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a new user</CardTitle>
            <CardDescription>
                Enter the user's email, role, and plan to add them to the team. They will be created with a default password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="new.user@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                 <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                 <Select value={invitePlan} onValueChange={(value: Plan) => setInvitePlan(value)}>
                    <SelectTrigger id="plan">
                        <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <UsersAdminClient 
        initialUsers={users}
        currentUserId={currentUser?.uid || ''}
      />
    </div>
  );
}
