'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicalTrial, Pipeline, PipelineStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FolderOpen, FlaskConical, BookMarked } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const phaseColors: { [key: string]: string } = {
  'Early Phase 1': 'bg-purple-500 text-white',
  'Phase 1': 'bg-blue-500 text-white',
  'Phase 2': 'bg-yellow-500 text-white',
  'Phase 3': 'bg-orange-500 text-white',
  'Phase 4': 'bg-green-500 text-white',
  'Not Applicable': 'bg-gray-400 text-white',
  'N/A': 'bg-gray-400 text-white',
};

const pipelineStatusColors: Record<PipelineStatus, string> = {
  Preclinical: 'bg-purple-500',
  'Phase 1': 'bg-blue-500',
  'Phase 2': 'bg-yellow-500',
  'Phase 3': 'bg-orange-500',
  'Phase 4': 'bg-green-500',
  Approved: 'bg-gray-500',
};

export default function FolderDetailClient({ studies, pipelines }: { studies: ClinicalTrial[], pipelines: Pipeline[] }) {

    if (studies.length === 0 && pipelines.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="bg-muted rounded-full p-4">
                    <FolderOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">This Folder is Empty</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    You can add studies and pipelines to this folder.
                </p>
                <div className="flex gap-4 mt-6">
                    <Button asChild>
                        <a href="/clinical-trials-search">
                            Find Studies
                        </a>
                    </Button>
                    <Button asChild variant="outline">
                        <a href="/pipeline">
                            Find Pipelines
                        </a>
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Tabs defaultValue="studies">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="studies">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Saved Studies ({studies.length})
                </TabsTrigger>
                <TabsTrigger value="pipelines">
                    <BookMarked className="mr-2 h-4 w-4" />
                    Saved Pipelines ({pipelines.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="studies">
                {studies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                        {studies.map((study: ClinicalTrial, index: number) => (
                            <Card key={study.nctId || index} className="flex flex-col h-full">
                                <CardHeader>
                                    <a href={study.url} target="_blank" rel="noopener noreferrer">
                                    <CardTitle className="text-base font-semibold leading-snug hover:underline">
                                        {study.briefTitle || 'No Title Provided'}
                                    </CardTitle>
                                    </a>
                                    <CardDescription className="text-xs pt-1">
                                        {study.condition || 'No condition specified'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-2 text-xs items-center">
                                        <div
                                            className={cn(
                                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                                phaseColors[study.phase as keyof typeof phaseColors] || 'bg-gray-200 text-gray-800'
                                            )}
                                            >
                                            {study.phase || 'N/A'}
                                        </div>
                                        <div 
                                            style={study.overallStatus === 'ACTIVE_NOT_RECRUITING' ? { backgroundColor: '#CA8A03' } : {}}
                                            className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-white', {
                                                'bg-green-600': ['RECRUITING', 'ENROLLING_BY_INVITATION'].includes(study.overallStatus as string),
                                                'bg-yellow-600': study.overallStatus === 'NOT_YET_RECRUITING',
                                                'bg-blue-600': study.overallStatus === 'COMPLETED',
                                                'bg-destructive': ['TERMINATED', 'WITHDRAWN'].includes(study.overallStatus as string),
                                                'bg-gray-500': !['RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING', 'COMPLETED', 'TERMINATED', 'WITHDRAWN', 'ACTIVE_NOT_RECRUITING'].includes(study.overallStatus as string),
                                            })}
                                        >
                                            {study.overallStatus.replace(/_/g, ' ')}
                                        </div>
                                        <Badge variant="outline">Start: {study.startDate ? format(parseISO(study.startDate), 'LLL yyyy') : 'N/A'}</Badge>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a 
                                            href={study.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            View on ClinicalTrials.gov <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="mt-6 flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <h3 className="text-xl font-semibold">No Saved Studies</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            You can add studies to this folder from the API Explorer page.
                        </p>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="pipelines">
                 {pipelines.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                        {pipelines.map((pipeline: Pipeline) => (
                           <Link key={pipeline.id} href={`/pipeline/${pipeline.id}`} className="block h-full">
                                <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-semibold leading-snug">
                                                {pipeline.name}
                                            </CardTitle>
                                            <Badge className={cn(pipelineStatusColors[pipeline.status], 'text-white')}>{pipeline.status}</Badge>
                                        </div>
                                        <CardDescription className="text-xs pt-1">
                                            {pipeline.indication}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{pipeline.mechanism}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                 ) : (
                    <Card className="mt-6 flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <h3 className="text-xl font-semibold">No Saved Pipelines</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            You can add pipelines to this folder from the Discovery Pipeline page.
                        </p>
                    </Card>
                 )}
            </TabsContent>
        </Tabs>
    );
}
