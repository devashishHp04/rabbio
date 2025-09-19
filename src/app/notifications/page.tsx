import { AppLayout } from '@/components/app-layout';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';

export default async function NotificationsPage() {
   const user = await getCurrentUser();
    if (!user) {
      return redirect('/');
    }
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Here are your recent notifications.
          </p>
        </div>
        {/* Placeholder for content */}
      </div>
    </AppLayout>
  );
}
