
import { AppLayout } from '@/components/app-layout';
import { getPipeline } from '@/services/pipeline';
import PipelineDetailClient from './client';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';

export default async function PipelineDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you'd get the user ID from the session.
  const userId = 'user123';
  
  // Fetch data on the server
  const pipeline = await getPipeline(params.id);

  // If the pipeline doesn't exist, show a 404 page
  if (!pipeline) {
    notFound();
  }

  return (
    <AppLayout>
      <PipelineDetailClient 
        pipeline={pipeline} 
      />
    </AppLayout>
  );
}
