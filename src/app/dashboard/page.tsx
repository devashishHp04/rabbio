
import { AppLayout } from '@/components/app-layout';
import { getPipelines } from '@/services/pipeline';
import DashboardClient from './client';
import { teamMembers } from '@/lib/data';
import { getCurrentUser } from '@/services/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  console.log(user,"user")
  if (!user) {
    console.log("user not ")
    return redirect('/');
  }
  const pipelines = await getPipelines(user);

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardClient pipelines={pipelines} teamMembers={teamMembers} />
      </div>
    </AppLayout>
  );
}
