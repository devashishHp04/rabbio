// src/app/api/clinical-trials/route.ts
import { searchClinicalTrials } from '@/services/clinical-trials';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const data = await searchClinicalTrials(query);
    // Always return a consistent object structure
    return NextResponse.json({ studies: data });
  } catch (error: any) {
    console.error('API Route Error fetching clinical trials:', error);
    // If the service layer threw an error with rawData, send it to the client.
    if (error.rawData) {
      return NextResponse.json({ 
        error: 'Failed to parse clinical trial data.',
        rawData: error.rawData,
       }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch clinical trial data.' }, { status: 500 });
  }
}
