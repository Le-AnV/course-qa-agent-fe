'use client';

import { toast } from 'sonner';

import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import type { ChatCitation } from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function openClassSource(citation: ChatCitation) {
  const viewer = window.open('', '_blank');
  if (viewer) viewer.opener = null;

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !citation.documentId) {
      throw new Error('This source file is not available.');
    }

    const response = await fetch(
      `${API_URL}/api/chat/sources/${encodeURIComponent(citation.documentId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { detail?: string } | null;
      throw new Error(body?.detail || 'The source file could not be opened.');
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const target = citation.page === null ? objectUrl : `${objectUrl}#page=${citation.page}`;
    if (viewer) viewer.location.href = target;
    else window.open(target, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    viewer?.close();
    toast.error(error instanceof Error ? error.message : 'The source file could not be opened.');
  }
}

export function CitationChip({ citation }: { citation: ChatCitation }) {
  const label = `[${citation.index}] ${citation.title}${
    citation.page === null ? '' : ` · Page ${citation.page}`
  }`;
  const className =
    'inline-flex items-center rounded-md bg-[#F7F7F7] px-2 py-1 text-xs font-medium text-[#5A5A5A] ring-1 ring-inset ring-[#DADADA]';

  if (citation.url) {
    return (
      <a
        href={citation.url}
        target="_blank"
        rel="noreferrer"
        title={citation.snippet}
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      title={citation.snippet}
      className={className}
      onClick={() => void openClassSource(citation)}
    >
      {label}
    </button>
  );
}
