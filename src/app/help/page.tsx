import { AppLayout } from '@/components/app-layout';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';

export default async function HelpPage() {
   const user = await getCurrentUser();
    if (!user) {
      return redirect('/');
    }
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
