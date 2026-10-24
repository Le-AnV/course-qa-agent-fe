import type { ChatCitation } from "./sse";

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
