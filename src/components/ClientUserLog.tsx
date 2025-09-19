'use client';

import { useEffect } from 'react';

export default function ClientUserLog({ label = 'Current user', value }: { label?: string; value: any }) {
  useEffect(() => {
    // Log to browser console
    // eslint-disable-next-line no-console
    console.log(label + ':', value);
  }, [label, value]);
  return null;
}


