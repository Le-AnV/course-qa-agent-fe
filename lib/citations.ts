import type { ChatCitation } from "./sse";

/** Turn provider-relative Google redirects into absolute URLs. */
export function normalizeCitationUrl(url: string | null | undefined): string | null {
  const cleaned = url?.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("//")) {
    return `https:${cleaned}`;
  }
  if (cleaned.startsWith("/goto?url=") || cleaned.startsWith("goto?url=")) {
    return `https://www.google.com/${cleaned.replace(/^\/+/, "")}`;
  }
  return cleaned;
}

/**
 * Stable identity for one citation inside an answer.
 *
 * The backend restarts citation indexes at 1 for every answer, so the index
 * alone is not unique when citations from different documents share a number.
 */
export function citationKey(citation: ChatCitation): string {
  return [
    citation.kind,
    citation.index,
    citation.documentId ?? citation.url ?? "",
    citation.page ?? "",
  ].join("|");
}

/** Append a streamed citation once, even if the same SSE event is replayed. */
export function mergeCitation(
  citations: ChatCitation[] | undefined,
  citation: ChatCitation,
): ChatCitation[] {
  const current = citations ?? [];
  const key = citationKey(citation);
  if (current.some((item) => citationKey(item) === key)) return current;
  return [...current, citation];
}

/** Remove duplicate citations loaded from persisted history. */
export function uniqueCitations(citations: ChatCitation[] | undefined): ChatCitation[] {
  const seen = new Set<string>();
  return (citations ?? []).filter((citation) => {
    const key = citationKey(citation);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Human-readable source label used inside the answer text. */
export function citationInlineLabel(citation: ChatCitation): string {
  const title = citation.title.trim() || 'Source';
  const page =
    citation.kind === 'curriculum' && citation.page !== null ? ` - Page ${citation.page}` : '';
  return `${title}${page}`;
}

function escapeInlineLabel(value: string): string {
  return value.replace(/([\\*_~`[\]()#])/g, '\\$&');
}

const MARKER_GROUP = /(?:\[\d+(?:\s*,\s*\d+)*\])+/g;

/**
 * Replace LLM citation markers (`[1]`, `[1][2]`) with readable italic source
 * labels, e.g. `(Git Lab Guide.pdf - Page 8)`. Fenced/inline code is left
 * untouched, and markers without a matching citation keep their raw form.
 */
export function formatInlineCitations(content: string, citations: ChatCitation[]): string {
  if (citations.length === 0 || !content.includes('[')) return content;

  const byMarker = new Map<number, ChatCitation>();
  for (const citation of citations) {
    const markers = citation.indexes.length > 0 ? citation.indexes : [citation.index];
    for (const marker of markers) {
      if (!byMarker.has(marker)) byMarker.set(marker, citation);
    }
  }
  if (byMarker.size === 0) return content;

  return content
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;

      return segment.replace(MARKER_GROUP, (match) => {
        const labels: string[] = [];
        const missing: number[] = [];

        for (const raw of match.match(/\d+/g) ?? []) {
          const marker = Number(raw);
          const citation = byMarker.get(marker);
          if (citation) labels.push(citationInlineLabel(citation));
          else missing.push(marker);
        }

        if (labels.length === 0) return match;

        const uniqueLabels = [...new Set(labels)].map(escapeInlineLabel);
        const label = `*(${uniqueLabels.join('; ')})*`;
        const leftovers = missing.map((marker) => `[${marker}]`).join('');
        return `${label}${leftovers}`;
      });
    })
    .join('');
}
