/**
 * Search Highlight Helper 
 * Pure function to split text into matching and non-matching parts for UI highlight rendering.
 */

export interface HighlightPart {
  text: string;
  match: boolean;
}

export function splitHighlightParts(text: string, keyword: string): HighlightPart[] {
  const trimmed = keyword.trim();
  if (!trimmed) return [{ text, match: false }];

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === trimmed.toLowerCase(),
    }));
}
