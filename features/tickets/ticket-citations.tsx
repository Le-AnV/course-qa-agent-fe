import { CitationChip } from '@/features/citations/citation-chip';
import type { ChatMessageCitation } from '@/features/history/types';
import { citationKey, mapHistoryCitation } from '@/lib/citations';

export function TicketCitations({ citations = [] }: { citations?: ChatMessageCitation[] }) {
  if (!citations.length) return null;
  return <div className="flex flex-wrap gap-2" aria-label="Ticket sources">
    {citations.map(mapHistoryCitation).map((citation) => <CitationChip key={citationKey(citation)} citation={citation} />)}
  </div>;
}
