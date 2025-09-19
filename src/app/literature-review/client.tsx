
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleSummarizePublication, handleSuggestExperiments } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SummarizePublicationOutput } from '@/ai/flows/summarize-publication';
import type { SuggestExperimentsOutput } from '@/ai/flows/suggest-experiments';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Loader2, Star, Target, Zap, Link as LinkIcon } from 'lucide-react';
import type { AuthenticatedUser } from '@/services/auth';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function SummaryForm({ onSummaryComplete }: { onSummaryComplete: (data: SummarizePublicationOutput) => void }) {
  const [state, formAction] = useActionState(handleSummarizePublication, null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message && state.message !== 'Success') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state?.message === 'Success' && state.data) {
      onSummaryComplete(state.data);
      formRef.current?.reset();
    }
  }, [state, toast, onSummaryComplete]);

  return (
    <Card>
        <CardHeader>
          <CardTitle>Summarize Publication</CardTitle>
          <CardDescription>Enter a URL to fetch and summarize a publication with AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicationUrl">Publication URL</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <Input id="publicationUrl" name="publicationUrl" placeholder="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC..." />
              </div>
              {state?.errors?.publicationUrl && <p className="text-sm font-medium text-destructive">{state.errors.publicationUrl[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description (Optional)</Label>
              <Textarea id="projectDescription" name="projectDescription" placeholder="Describe your current research project for context..." rows={3} />
               {state?.errors?.projectDescription && <p className="text-sm font-medium text-destructive">{state.errors.projectDescription[0]}</p>}
            </div>
            <SubmitButton>Summarize</SubmitButton>
          </form>
        </CardContent>
      </Card>
  );
}

function SummaryResults({ data, onUseForSuggestions }: { data: SummarizePublicationOutput | null, onUseForSuggestions: (literature: string) => void }) {
  if (!data) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">AI Summary Awaits</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your publication summary and analysis will appear here.</p>
        </div>
      </Card>
    );
  }
  
  const handleUseForSuggestions = () => {
      const literatureText = `Based on the summary: "${data.summary}" and the suggested experiments: "${data.suggestedExperiments}"`;
      onUseForSuggestions(literatureText);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
             <CardTitle>Summary</CardTitle>
             <CardDescription>Key findings from the publication.</CardDescription>
          </div>
           <Badge variant="secondary" className="flex items-center gap-1.5">
             <Star className="h-4 w-4 text-yellow-500" />
             Relevance: {Math.round(data.relevanceScore * 100)}%
           </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.summary}</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
             <CardTitle>Suggested Experiments</CardTitle>
             <CardDescription>Potential next steps based on the findings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.suggestedExperiments}</p>
        </CardContent>
         <CardFooter>
            <Button onClick={handleUseForSuggestions}>Use for Suggestions</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function SuggestionForm({ isPro, literatureText, onLiteratureTextChange }: { isPro: boolean, literatureText: string, onLiteratureTextChange: (text: string) => void }) {
  const [state, formAction] = useActionState(handleSuggestExperiments, null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

   useEffect(() => {
    if (state?.message && state.message !== 'Success') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state?.message === 'Success') {
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Suggest Experiments</CardTitle>
          <CardDescription>Provide project state and literature to generate novel experiment ideas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <form ref={formRef} action={formAction} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="projectState">Current Project State</Label>
                <Textarea id="projectState" name="projectState" placeholder="e.g., We have identified a promising compound but need to validate its efficacy in vivo..." rows={5} />
                {state?.errors?.projectState && <p className="text-sm font-medium text-destructive">{state.errors.projectState[0]}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="relevantLiterature">Relevant Literature Summary</Label>
                <Textarea 
                    id="relevantLiterature" 
                    name="relevantLiterature" 
                    placeholder="e.g., Recent studies show that targeting the XYZ pathway can reduce tumor growth..." 
                    rows={5}
                    value={literatureText}
                    onChange={(e) => onLiteratureTextChange(e.target.value)}
                />
                {state?.errors?.relevantLiterature && <p className="text-sm font-medium text-destructive">{state.errors.relevantLiterature[0]}</p>}
                </div>
                <SubmitButton>Get Suggestions</SubmitButton>
            </form>
            ) : (
             <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50/50 p-8 text-center dark:bg-yellow-900/10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-yellow-900 dark:text-yellow-200">Upgrade to Pro to Suggest Experiments</h3>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  This advanced AI feature is available exclusively for Pro subscribers. Unlock powerful experiment suggestions to accelerate your research.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/pricing">Upgrade Your Plan</Link>
                </Button>
              </div>
          )}
        </CardContent>
      </Card>
      <SuggestionResults data={state?.data} />
    </div>
  );
}

function SuggestionResults({ data }: { data: SuggestExperimentsOutput | null }) {
   if (!data) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Experiment Ideas Await</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your suggested experiments will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Suggested Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {data.suggestedExperiments.map((exp, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{i + 1}</div>
                <span className="flex-1 text-sm">{exp}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rationale</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.rationale}</p>
        </CardContent>
      </Card>
    </div>
  );
}


export default function LiteratureReviewClient({ user }: { user: AuthenticatedUser | null }) {
  const isPro = user?.plan === 'pro';
  const [summaryData, setSummaryData] = useState<SummarizePublicationOutput | null>(null);
  const [literatureForSuggestion, setLiteratureForSuggestion] = useState('');
  const suggestionFormRef = useRef<HTMLDivElement>(null);

  const handleUseForSuggestions = (literature: string) => {
    setLiteratureForSuggestion(literature);
    suggestionFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SummaryForm onSummaryComplete={setSummaryData} />
        <SummaryResults data={summaryData} onUseForSuggestions={handleUseForSuggestions} />
      </div>
      <div ref={suggestionFormRef}>
        <SuggestionForm 
            isPro={isPro} 
            literatureText={literatureForSuggestion}
            onLiteratureTextChange={setLiteratureForSuggestion}
        />
      </div>
    </div>
  );
}
