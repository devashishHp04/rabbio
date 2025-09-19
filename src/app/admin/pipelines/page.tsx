
import { getPipelines } from '@/services/pipeline';
import PipelineAdminClient from './client';
import { getCurrentUser } from '@/services/auth';

export default async function AdminPipelinesPage() {
  const pipelines = await getPipelines();
  const user = await getCurrentUser();

  return (
    <div>
      <PipelineAdminClient 
        initialPipelines={pipelines}
        userRole={user?.role || 'viewer'} 
      />
    </div>
  );
}
