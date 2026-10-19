'use client';

import * as React from 'react';
import { studentApi } from '@/lib/student-api';

/**
 * Code/name for the chat scope badge. The chat only has a class id (often a
 * UUID), which reads as noise on screen, so the real class is looked up and
 * passed down as a label.
 */
export function useClassLabel(classId: string): string | null {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      try {
        const cls = await studentApi.classDetail(classId);
        if (!cancelled && cls) {
          setLabel(`${cls.code} · ${cls.name}`);
        }
      } catch {
        if (!cancelled) setLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  return label;
}
