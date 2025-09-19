'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generate } from 'genkit/ai';
import { configureGenkit } from 'genkit/core';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [googleAI()],
});

export async function suggestExperiments({ projectState, literatureSummary, userId }: {
  projectState: string;
  literatureSummary: string;
  userId: string;
}) {
  if (projectState.length < 20 || literatureSummary.length < 50) {
    throw new Error("Validation failed: Input text is too short.");
  }

  const prompt = `Given the project state: "${projectState}" and literature summary: "${literatureSummary}", suggest 3 innovative, practical experiments to continue the research. Format the output as a numbered list.`;

  const result = await generate({
    model: 'googleai/gemini-1.5-flash',
    prompt,
  });

  const experiments = result.text();

  if (!experiments) {
    throw new Error('The AI model could not generate experiment suggestions.');
  }

  await addDoc(collection(db, `users/${userId}/experiments`), {
    projectState,
    literatureSummary,
    experiments,
    createdAt: serverTimestamp(),
  });

  return experiments;
}
