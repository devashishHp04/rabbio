
'use client';

import { useActionState, useEffect } from 'react';
import { handleCreateAdminUser } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function CreateAdminButton() {
  const { pending } = useActionState(handleCreateAdminUser, null) as any;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Admin Account
    </Button>
  );
}

export default function CreateAdminPage() {
  const [state, formAction] = useActionState(handleCreateAdminUser, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success === true) {
      toast({
        title: 'Success!',
        description: state.message,
        className: 'bg-green-100 dark:bg-green-900',
      });
    } else if (state?.success === false && state.message) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Initial Admin User</CardTitle>
          <CardDescription>
            This page creates the first administrator account for your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Security Warning</p>
                <p>This page should only be used once for initial setup. Please consider deleting it from your project after creating the admin user.</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 rounded-md bg-muted p-4">
            <p className="font-semibold">Admin Credentials:</p>
            <p><strong>Email:</strong> <code className="bg-muted-foreground/20 px-1 py-0.5 rounded-sm">admin@rabbio.com</code></p>
            <p><strong>Password:</strong> <code className="bg-muted-foreground/20 px-1 py-0.5 rounded-sm">password123</code></p>
          </div>
          
          <form action={formAction}>
            <CreateAdminButton />
          </form>

           {state?.success && (
            <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                 <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Admin Account Ready!</p>
                        <p>You can now log in with the credentials above.</p>
                         <Button asChild variant="link" className="p-0 h-auto mt-2">
                            <Link href="/">Go to Login Page</Link>
                        </Button>
                    </div>
                </div>
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  );
}
