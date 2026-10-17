'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import type { ChatCitation } from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function CitationChip({ citation }: { citation: ChatCitation }) {
  const [isOpening, setIsOpening] = React.useState(false);

  const openSource = async () => {
    setIsOpening(true);
    const sourceWindow = window.open('about:blank', '_blank');
    if (sourceWindow) sourceWindow.opener = null;
    try {
      const response = await fetch(`${API_URL}${citation.url}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}`,
        },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'The source document could not be opened.');
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const pageFragment = citation.file_name.toLowerCase().endsWith('.pdf') && citation.page
        ? `#page=${citation.page}`
        : '';
      if (sourceWindow) sourceWindow.location.href = `${objectUrl}${pageFragment}`;
      else window.open(`${objectUrl}${pageFragment}`, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      sourceWindow?.close();
      toast.error(error instanceof Error ? error.message : 'The source document could not be opened.');
    } finally {
      setIsOpening(false);
    }
  };

  const location = [citation.heading, citation.page ? `Page ${citation.page}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={openSource}
      disabled={isOpening}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-left text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      title={location || citation.file_name}
    >
      <span className="shrink-0">{citation.marker}</span>
      <span className="truncate">{citation.file_name}</span>
      {location && <span className="hidden truncate text-slate-400 sm:inline">· {location}</span>}
      {isOpening ? <Loader2 className="size-3 shrink-0 animate-spin" /> : <ExternalLink className="size-3 shrink-0" />}
    </button>
  );
}
