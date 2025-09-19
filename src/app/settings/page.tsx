
import { AppLayout } from '@/components/app-layout';
import SettingsClient from './client';
import { getSettings } from '@/services/settings';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const settings = await getSettings(user.uid);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
                <Link href="/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <SettingsClient initialSettings={settings} />
      </div>
    </AppLayout>
  );
}
