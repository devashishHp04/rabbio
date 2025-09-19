import { AppLayout } from '@/components/app-layout';

export default function ResourceHubPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Hub</h1>
          <p className="text-muted-foreground">
            Access documentation, tutorials, and support resources.
          </p>
        </div>
        {/* Placeholder for content */}
      </div>
    </AppLayout>
  );
}
