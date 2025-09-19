
import { AppLayout } from '@/components/app-layout';
import { getPipelines } from '@/services/pipeline';
import DashboardClient from './client';
import { teamMembers } from '@/lib/data';
import { getCurrentUser } from '@/services/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const pipelines = await getPipelines(user);

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardClient pipelines={pipelines} teamMembers={teamMembers} />
      </div>
    </AppLayout>
  );
}
