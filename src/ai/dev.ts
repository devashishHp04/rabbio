import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-publication.ts';
import '@/ai/flows/suggest-experiments.ts';
import '@/ai/flows/extract-disease.ts';
