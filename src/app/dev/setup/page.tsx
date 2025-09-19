
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { createSampleUser } from './actions';
import type { UserRole, Plan } from '@/lib/types';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';

type UserType = {
    email: string;
    role: UserRole;
    plan: Plan;
};

const sampleUsers: UserType[] = [
    { email: 'admin@rabbio.com', role: 'admin', plan: 'pro' },
    { email: 'pro@rabbio.com', role: 'viewer', plan: 'pro' },
    { email: 'standard@rabbio.com', role: 'viewer', plan: 'standard' },
    { email: 'researcher@rabbio.com', role: 'viewer', plan: 'free' },
];

export default async function DevSetupPage() {

  const { toast } = useToast();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [createdUsers, setCreatedUsers] = useState<Set<string>>(new Set());

   const user = await getCurrentUser();
    if (!user) {
      return redirect('/');
    }

  const handleCreateUser = async (user: UserType) => {
    setLoadingUser(user.email);
    try {
      const result = await createSampleUser(user);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setCreatedUsers((prev) => new Set(prev).add(user.email));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An unexpected error occurred',
        description: error.message,
      });
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Developer Setup</CardTitle>
          <CardDescription>
            Create sample users to populate your Firebase Authentication and Firestore database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">For Development Only</p>
                <p>This page creates users with the password <code className="bg-muted-foreground/20 px-1 py-0.5 rounded-sm">password123</code>. It should be removed before deploying to production.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {sampleUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-semibold">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="font-medium capitalize">{user.role}</span>, Plan: <span className="font-medium capitalize">{user.plan}</span>
                  </p>
                </div>
                <Button
                  onClick={() => handleCreateUser(user)}
                  disabled={!!loadingUser || createdUsers.has(user.email)}
                  variant={createdUsers.has(user.email) ? 'outline' : 'default'}
                  size="sm"
                >
                  {loadingUser === user.email ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : createdUsers.has(user.email) ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  ) : null}
                  {createdUsers.has(user.email) ? 'Created' : 'Create'}
                </Button>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </main>
  );
}
