
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '../actions';
import type { AuthenticatedUser, UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function UsersAdminClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AuthenticatedUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = React.useState(initialUsers);
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: 'Role Updated',
        description: `User role has been successfully changed to ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">
                        {user.plan}
                    </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(newRole: UserRole) => handleRoleChange(user.uid, newRole)}
                    defaultValue={user.role || 'viewer'}
                    disabled={user.uid === currentUserId}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
