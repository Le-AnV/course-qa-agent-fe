import * as React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import type { CitationItem } from './types';

interface InternetSourceBadgeProps {
  citation: CitationItem;
}

export function InternetSourceBadge({ citation }: InternetSourceBadgeProps) {
  const handleClick = () => {
    if (citation.jump_url) {
      window.open(citation.jump_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer bg-amber-50/80 text-amber-900 ring-1 ring-inset ring-amber-300 hover:bg-amber-100 hover:ring-amber-400"
      title={`Open web source and jump to excerpt: ${citation.document_name}`}
    >
      <span className="font-semibold text-amber-950">[{citation.citation_id}]</span>
      <Globe className="w-3.5 h-3.5 text-amber-700" />
      <span className="max-w-[130px] truncate">{citation.document_name}</span>
      <span className="text-[10px] text-amber-800 bg-white/80 px-1 py-0.5 rounded border border-amber-200">
        Web
      </span>
      <ExternalLink className="w-3 h-3 text-amber-700 opacity-80" />
    </button>
  );
}
