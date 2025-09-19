
import { AppLayout } from '@/components/app-layout';
import { getCurrentUser } from '@/services/auth';
import LiteratureReviewClient from './client';
import { redirect } from 'next/navigation';

export default async function LiteratureReviewPage() {
   const user = await getCurrentUser();
    if (!user) {
      return redirect('/');
    }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Literature Insights</h1>
          <p className="text-muted-foreground">
            Extract insights, summarize publications, and generate experiment ideas to inform your strategy.
          </p>
        </div>
        <LiteratureReviewClient user={user} />
      </div>
    </AppLayout>
  );
}
