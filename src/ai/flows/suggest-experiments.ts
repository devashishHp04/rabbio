// src/ai/flows/suggest-experiments.ts
'use server';
/**
 * @fileOverview A flow that suggests experiments based on the current state of a project and relevant literature.
 *
 * - suggestExperiments - A function that handles the experiment suggestion process.
 * - SuggestExperimentsInput - The input type for the suggestExperiments function.
 * - SuggestExperimentsOutput - The return type for the suggestExperiments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExperimentsInputSchema = z.object({
  projectState: z
    .string()
    .describe('The current state of the research project.'),
  relevantLiterature: z
    .string()
    .describe('Summarized relevant literature for the project.'),
});
export type SuggestExperimentsInput = z.infer<typeof SuggestExperimentsInputSchema>;

const SuggestExperimentsOutputSchema = z.object({
  suggestedExperiments: z
    .array(z.string())
    .describe('A list of suggested experiments based on the project state and literature.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested experiments.'),
});
export type SuggestExperimentsOutput = z.infer<typeof SuggestExperimentsOutputSchema>;

export async function suggestExperiments(input: SuggestExperimentsInput): Promise<SuggestExperimentsOutput> {
  return suggestExperimentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExperimentsPrompt',
  input: {schema: SuggestExperimentsInputSchema},
  output: {schema: SuggestExperimentsOutputSchema},
  prompt: `You are an AI research assistant tasked with suggesting experiments to accelerate the discovery process. Based on the current project state and relevant literature, suggest a list of experiments and provide a rationale for each suggestion.

Current Project State: {{{projectState}}}

Relevant Literature: {{{relevantLiterature}}}

Experiments should be novel and likely to yield useful data.  Limit your suggestions to a numbered list of 3 experiments.

{{output}}
`,
});

const suggestExperimentsFlow = ai.defineFlow(
  {
    name: 'suggestExperimentsFlow',
    inputSchema: SuggestExperimentsInputSchema,
    outputSchema: SuggestExperimentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
