
import { AppLayout } from '@/components/app-layout';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ClientUserLog from '@/components/ClientUserLog';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();


  console.log('Current user:', user);

  // Protect the entire admin section - allow 'admin' and 'editor' roles
  const role = (user?.role as string) || '';
  if (!user || (role !== 'admin' && role !== 'editor')) {
    redirect('/dashboard');
  }

  return (
    <AppLayout>
        {/* Client-side log so you can see user in DevTools */}
        <ClientUserLog label="Current user" value={user} />
        <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage your application's data and users.
              </p>
            </div>
            <main>{children}</main>
        </div>
    </AppLayout>
  );
}
