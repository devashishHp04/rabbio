// src/components/outcome-measures.tsx
'use client';

import React from 'react';
import type { Outcome } from '@/lib/types';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

const FormattedDescription = ({ description }: { description: string | null }) => {
  if (!description) return null;

  const lines = description.replace(/\\n/g, '\n').split('\n').filter(line => line.trim() !== '');

  return (
    <div className="text-muted-foreground space-y-1 mt-1">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('**')) {
             return (
                <div key={index} className="flex items-start gap-2 pl-8">
                    <span className="mt-1">&bull;</span>
                    <span>{trimmedLine.substring(2).trim()}</span>
                </div>
            );
        }
        if (trimmedLine.startsWith('*')) {
          return (
            <div key={index} className="flex items-start gap-2 pl-4">
              <span className="mt-1">&bull;</span>
              <span>{trimmedLine.substring(1).trim()}</span>
            </div>
          );
        }
        return <p key={index}>{trimmedLine}</p>;
      })}
    </div>
  );
};

export function OutcomeMeasures({ outcomes }: { outcomes?: Outcome[] | null }) {
  if (!outcomes || outcomes.length === 0) {
    return (
        <div className="grid grid-cols-[150px_1fr] items-start gap-4">
            <Label className="text-right font-semibold text-muted-foreground pt-1">Outcome Measures</Label>
            <div className="text-sm text-muted-foreground">
                No outcome measures were provided for this trial.
            </div>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-[150px_1fr] items-start gap-4">
      <Label className="text-right font-semibold text-muted-foreground pt-1">Outcome Measures</Label>
      <div className="space-y-6 text-sm">
        {outcomes.map((outcome, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-start justify-between gap-4">
              <h4 className="font-semibold text-foreground flex-1">{outcome.measure}</h4>
              {outcome.type && (
                 <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider">
                    {outcome.type}
                </span>
              )}
            </div>
            {outcome.timeFrame && <p className="text-xs text-muted-foreground mt-1">Time Frame: {outcome.timeFrame}</p>}
            <FormattedDescription description={outcome.description} />
            {index < outcomes.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
