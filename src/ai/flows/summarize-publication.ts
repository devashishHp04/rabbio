
// Summarizes scientific publications for researchers.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const SummarizePublicationInputSchema = z.object({
  publicationUrl: z.string().url().describe('The URL of the scientific publication to summarize.'),
  projectDescription: z.string().optional().describe('A description of the research project for context.'),
});
export type SummarizePublicationInput = z.infer<typeof SummarizePublicationInputSchema>;


const SummarizeUrlInputSchema = z.object({
  publicationUrl: z.string().url().describe('The URL of the scientific publication to summarize.'),
  projectDescription: z.string().optional().describe('A description of the research project for context.'),
});
export type SummarizeUrlInput = z.infer<typeof SummarizeUrlInputSchema>;

const SummarizePublicationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the scientific publication, highlighting key findings and relevance to the research project.'),
  relevanceScore: z.number().describe('A score (0-1) indicating the relevance of the publication to the research project.'),
  suggestedExperiments: z.string().describe('Suggested experiments based on the publication.'),
});
export type SummarizePublicationOutput = z.infer<typeof SummarizePublicationOutputSchema>;

export async function fetchAndSummarizeUrl(input: SummarizeUrlInput): Promise<SummarizePublicationOutput> {
  return summarizePublicationFlow(input);
}

const summarizePublicationPrompt = ai.definePrompt({
  name: 'summarizePublicationPrompt',
  input: {schema: SummarizeUrlInputSchema},
  output: {schema: SummarizePublicationOutputSchema},
  tools: [googleAI],
  prompt: `You are an AI research assistant. Your task is to summarize a scientific publication from a given URL and determine its relevance to a research project.

  1. Use the browse tool to fetch the content from the provided publicationUrl: {{{publicationUrl}}}.
  2. Read the content of the article.
  3. Provide a concise summary of the publication, a relevance score (0-1), and suggest potential experiments that could be conducted based on the publication's findings.

  {{#if projectDescription}}
  Project Description: {{{projectDescription}}}
  The relevance score should be based on the provided project description.
  {{else}}
  Since no project description is provided, the relevance score should be a general assessment of the publication's impact and importance in its field.
  {{/if}}

  Summary:
  Relevance Score:
  Suggested Experiments:`,
});

const summarizePublicationFlow = ai.defineFlow(
  {
    name: 'summarizePublicationFlow',
    inputSchema: SummarizeUrlInputSchema,
    outputSchema: SummarizePublicationOutputSchema,
  },
  async (input) => {
    try {
      console.log('Calling summarizer for URL:', input.publicationUrl);
      const {output} = await summarizePublicationPrompt(input);
      
      if (!output) {
        throw new Error("The AI model did not produce a summary.");
      }
      
      console.log('Content summarized successfully.');
      return output;

    } catch (error: any) {
        console.error("Error in summarizePublicationFlow:", error);
        // Re-throw a more user-friendly error message.
        throw new Error(`Failed to process the URL. Reason: ${error.message}`);
    }
  }
);


