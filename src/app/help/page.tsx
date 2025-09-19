import { AppLayout } from '@/components/app-layout';

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to your questions or contact our support team.
          </p>
        </div>
        {/* Placeholder for content */}
      </div>
    </AppLayout>
  );
}
