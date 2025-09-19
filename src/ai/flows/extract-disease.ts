'use server';
/**
 * @fileOverview A flow that extracts the primary disease name from a string.
 *
 * - extractDisease - A function that handles the disease extraction process.
 * - ExtractDiseaseInput - The input type for the extractDisease function.
 * - ExtractDiseaseOutput - The return type for the extractDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDiseaseInputSchema = z.object({
  conditionText: z
    .string()
    .describe('The full text from a clinical trial condition field.'),
  briefTitle: z
    .string()
    .describe("The brief title of the clinical trial."),
  briefSummary: z
    .string()
    .describe("The brief summary of the clinical trial."),
});
export type ExtractDiseaseInput = z.infer<typeof ExtractDiseaseInputSchema>;

const ExtractDiseaseOutputSchema = z.object({
  diseaseName: z
    .string()
    .describe('The extracted primary disease or condition name. If no specific disease is mentioned, this should be an empty string.'),
});
export type ExtractDiseaseOutput = z.infer<typeof ExtractDiseaseOutputSchema>;

export async function extractDisease(input: ExtractDiseaseInput): Promise<ExtractDiseaseOutput> {
  return extractDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDiseasePrompt',
  input: {schema: ExtractDiseaseInputSchema},
  output: {schema: ExtractDiseaseOutputSchema},
  prompt: `You are an expert in parsing clinical trial data. Your task is to extract ONLY the primary disease or specific clinical condition being studied from the provided information.

Follow these steps:
1. First, analyze the "Condition Text". This field may contain multiple terms. Identify and extract the specific disease. For example, if the text is "Mpox (Monkeypox), Vaccination, Immunogenicity, Safety, Infants, Children", you must extract only "Mpox (Monkeypox)". Ignore general concepts like "Vaccination" or "Safety", and ignore patient populations like "Infants" or "Children".

2. If the "Condition Text" does NOT contain a specific disease (e.g., it only says "Neonate", "Healthy Volunteers", "Safety Study"), then you MUST analyze the "Brief Title" and "Brief Summary" to find the actual disease being studied. The title or summary will often contain the specific disease.

3. If, after analyzing all fields, you cannot find a specific disease, return an empty string for the disease name.

Analyze the following information:

Condition Text: {{{conditionText}}}
Brief Title: {{{briefTitle}}}
Brief Summary: {{{briefSummary}}}
`,
});

const extractDiseaseFlow = ai.defineFlow(
  {
    name: 'extractDiseaseFlow',
    inputSchema: ExtractDiseaseInputSchema,
    outputSchema: ExtractDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
