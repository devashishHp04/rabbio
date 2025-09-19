import { AppLayout } from '@/components/app-layout';

export default function NotificationsPage() {
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
