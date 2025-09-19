'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generate } from 'genkit/ai';
import { configureGenkit } from 'genkit/core';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [googleAI()],
});

export async function summarizePublication({ url, projectDescription, userId }: {
  url: string;
  projectDescription?: string;
  userId: string;
}) {
  if (!url || !url.startsWith('http')) {
      throw new Error('A valid URL is required.');
  }

  // This prompt now instructs the model to use the browse tool.
  const prompt = `
    1. **Use the provided browse tool** to fetch the content from the publicationUrl: ${url}. Do not attempt to fetch it directly.
    2. Analyze the full text of the article.
    3. Provide a concise summary of the publication's key findings, purpose, and methods.
    
    ${projectDescription ? `The summary should be tailored to this project description: ${projectDescription}` : ''}
  `;

  const result = await generate({
    model: 'googleai/gemini-1.5-flash',
    prompt,
    tools: [googleAI.browse()], // Provide the browse tool to the model
  });

  const summary = result.text();

  if (!summary) {
    throw new Error('The AI model could not generate a summary. The URL may be inaccessible or contain no content.');
  }

  await addDoc(collection(db, `users/${userId}/summaries`), {
    url,
    projectDescription,
    summary,
    createdAt: serverTimestamp(),
  });

  return summary;
}
