
import { AppLayout } from '@/components/app-layout';
import PipelineClient from './client';
import { getPipelines } from '@/services/pipeline';
import { getCurrentUser } from '@/services/auth';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';

async function PipelineFallback() {
   const user = await getCurrentUser();
    if (!user) {
      return redirect('/');
    }
    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}


export default async function PipelinePage() {
  const user = await getCurrentUser();
  const pipelines = await getPipelines(user);
  
  return (
    <AppLayout>
      <div className="space-y-8">
         <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Intelligence</h1>
          <p className="text-muted-foreground">
            Browse and analyze the drug development pipeline for a competitive edge.
          </p>
        </div>
        <Suspense fallback={<PipelineFallback />}>
            <PipelineClient pipelines={pipelines} user={user} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
