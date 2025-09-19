
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, BookOpen, CheckCircle, FilePlus2, Headset, FlaskConical, AlertTriangle, Building, Tag, ArrowLeft } from 'lucide-react';
import { getPipelines } from '@/services/pipeline';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/services/auth';

const statusColors: Record<string, string> = {
  Preclinical: 'bg-purple-500',
  'Phase 1': 'bg-blue-500',
  'Phase 2': 'bg-yellow-500',
  'Phase 3': 'bg-orange-500',
  'Phase 4': 'bg-green-500',
  Approved: 'bg-gray-500',
};


const softwareUpdates = [
  {
    title: 'Enhanced Clinical Trials API Explorer (v2.1.0)',
    content: `
      <ul class="list-disc space-y-2 pl-6 text-sm">
        <li>Added advanced filtering options for study status, phase, and location to the API Explorer page.</li>
        <li>Improved error handling to show detailed messages from the ClinicalTrials.gov API when a search fails.</li>
        <li>You can now save interesting trials to custom folders directly from the search results.</li>
        <li>UI has been updated for better readability and a more consistent user experience.</li>
      </ul>
    `,
  },
  { title: 'Introduced "My Folders" for Study Organization (v2.0.0)', content: 'You can now create folders from your profile to save and organize clinical trials. This helps in tracking studies relevant to your research.' },
  { title: 'Pipeline Timeline Visualization (v1.5.0)', content: 'A new Gantt chart view has been added to visualize pipeline timelines, dependencies, and resource allocation, helping with project management.' },
];

export default async function WhatsNewPage() {
    const user = await getCurrentUser();
    const allPipelines = await getPipelines(user);
    // Sort pipelines by dateCreated descending, and take the top 3
    const newPipelines = allPipelines
        .sort((a, b) => new Date(b.dateCreated || 0).getTime() - new Date(a.dateCreated || 0).getTime())
        .slice(0, 3);
        
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12 pb-16">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
        <div className="text-center bg-primary/5 p-8 rounded-lg">
          <h1 className="text-3xl font-bold tracking-tight">What's new on Rabbio ✨</h1>
          <p className="mt-2 text-muted-foreground">
            We're constantly improving our platform to give you a competitive edge.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-center">Newly Added Drug Pipelines</h2>
          <p className="text-muted-foreground text-center mt-2 mb-8">
            The latest additions to our drug pipeline intelligence database.
          </p>
          <Card>
            <CardContent className="p-6 space-y-4">
              {newPipelines.map((pipeline, index) => (
                <div key={pipeline.id}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex-grow">
                             <h3 className="font-semibold text-lg">{pipeline.name}</h3>
                             <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                             <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                                 <div className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> {pipeline.therapeuticArea}</div>
                                 <div className="flex items-center gap-1.5"><Building className="h-3 w-3" /> {pipeline.company}</div>
                             </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                             <Badge className={`${statusColors[pipeline.status]} text-white`}>{pipeline.status}</Badge>
                             <Button asChild variant="outline" size="sm">
                                 <Link href={`/pipeline/${pipeline.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                             </Button>
                        </div>
                    </div>
                    {index < newPipelines.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              <div className="text-center mt-6">
                <Button variant="link" asChild>
                    <Link href="/pipeline">View all pipelines <ArrowRight className="ml-2 h-4" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center">Software Updates</h2>
          <p className="text-muted-foreground text-center mt-2 mb-8">
            Check out our latest product improvements and feature releases.
          </p>
          <Card>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {softwareUpdates.map((update, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{update.title}</AccordionTrigger>
                    <AccordionContent>
                      <div dangerouslySetInnerHTML={{ __html: update.content }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center">Help & Resources</h2>
          <p className="text-muted-foreground text-center mt-2 mb-8">
            Need help or want to learn more? We've got you covered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary"/>
                        Resource Hub
                    </CardTitle>
                    <CardDescription>Access documentation, tutorials, and support resources.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/resource-hub">Go to Resource Hub <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Headset className="h-6 w-6 text-primary"/>
                        Contact Support
                    </CardTitle>
                    <CardDescription>Have a question or need assistance? Our team is here to help.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/support">Contact Support <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardContent>
            </Card>
          </div>
        </section>

        <section className="text-center p-8 bg-green-50 rounded-lg">
           <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
           <h2 className="text-2xl font-bold">You're all caught up!</h2>
           <p className="text-muted-foreground mt-2">
            You've seen all the latest updates.
           </p>
        </section>
      </div>
    </AppLayout>
  );
}
