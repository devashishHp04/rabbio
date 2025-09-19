// src/components/formatted-criteria.tsx
'use client';

import React from 'react';

interface FormattedCriteriaProps {
  text?: string | null;
}

const renderListItem = (line: string, index: number) => {
  const trimmedLine = line.trim();
  
  if (trimmedLine.startsWith('**')) {
    const text = trimmedLine.substring(2).trim();
    return (
      <li key={index} className="flex items-start gap-2 pl-6">
        <span>-</span>
        <span>{text}</span>
      </li>
    );
  }
  
  if (trimmedLine.startsWith('*')) {
    const text = trimmedLine.substring(1).trim();
    return (
       <li key={index} className="flex items-start gap-2">
        <span className="font-bold text-lg leading-tight mt-0.5">&bull;</span>
        <span>{text}</span>
      </li>
    );
  }
  return <li key={index}>{trimmedLine}</li>;
};

export function FormattedCriteria({ text }: FormattedCriteriaProps) {
  if (!text) {
    return <p className="text-sm text-muted-foreground">No eligibility criteria provided.</p>;
  }

  // Normalize newlines and split into lines, filtering out empty ones
  const lines = text.replace(/\\n/g, '\n').split('\n').filter(line => line.trim() !== '');
  
  const sections: { title: string; criteria: string[] }[] = [];
  let currentSection: { title: string; criteria: string[] } | null = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    // Use a more robust regex to detect section headers.
    if (trimmedLine.match(/^(ARM\s+[A-Z0-9]+:|Inclusion Criteria:|Exclusion Criteria:)/i)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmedLine.replace(/:$/, ''), criteria: [] };
    } else if (currentSection) {
      currentSection.criteria.push(trimmedLine);
    } else {
      // Handle text that doesn't start with a recognized header by creating a default section.
      currentSection = { title: 'General Criteria', criteria: [trimmedLine] };
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections were parsed, treat the whole text as one list.
  if (sections.length === 0 && lines.length > 0) {
    sections.push({ title: 'Eligibility Criteria', criteria: lines });
  }

  return (
    <div className="space-y-6 text-sm">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h4 className="font-bold text-base mb-2 text-foreground">{section.title}</h4>
          {section.criteria.length > 0 ? (
            <ul className="space-y-2 list-none pl-4">
              {section.criteria.map(renderListItem)}
            </ul>
          ) : (
             <p className="text-sm text-muted-foreground">No specific criteria listed for this section.</p>
          )}
        </div>
      ))}
    </div>
  );
}
