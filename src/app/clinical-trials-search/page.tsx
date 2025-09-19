
import { AppLayout } from '@/components/app-layout';
import { getCurrentUser } from '@/services/auth';
import ClinicalTrialsSearchClient from './client';

export default async function ClinicalTrialsSearchPage() {
  const user = await getCurrentUser();
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Trials</h1>
          <p className="text-muted-foreground">
            Use the filters below to query the clinicaltrials.gov API in real-time.
          </p>
        </div>
        <ClinicalTrialsSearchClient user={user} />
      </div>
    </AppLayout>
  );
}
