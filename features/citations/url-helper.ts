/**
 * Utility for constructing W3C-compliant Scroll-to-Text-Fragment URLs.
 * Specification: https://wicg.github.io/scroll-to-text-fragment/
 * Supported across Chromium (Chrome, Edge, Brave, Opera) and WebKit (Safari 16.1+).
 */

/**
 * Builds a universal deep-linking URL for any web page that automatically
 * scrolls the browser to the exact excerpt and highlights it with yellow background.
 *
 * Uses W3C range directive `#:~:text=textStart,textEnd` to remain robust against
 * minor formatting, embedded links, or text changes between the start and end tokens.
 *
 * @param baseUrl The standard web URL (e.g. from Tavily search result)
 * @param snippet The raw snippet or excerpt returned by the search engine or AI
 * @returns Fully formatted URL with text fragment
 */
export function buildUniversalJumpUrl(
  baseUrl: string,
  snippet?: string | null
): string {
  if (!baseUrl) return '';
  const cleanBase = baseUrl.split('#')[0];
  if (!snippet || !snippet.trim()) return cleanBase;

  // Normalize whitespace and strip invisible characters
  const normalized = snippet
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ');

  const words = normalized.split(' ').filter(Boolean);
  if (words.length === 0) return cleanBase;

  // Clean trailing/leading punctuation on start/end words that might confuse fragment parsers
  const cleanWord = (w: string) => w.replace(/^["'([{«]+|[)"'\]}».,;:!?]+$/g, '');

  // For short phrases (<= 5 words), exact match is safest
  if (words.length <= 5) {
    const query = words.map(cleanWord).filter(Boolean).join(' ');
    return `${cleanBase}#:~:text=${encodeURIComponent(query || words.join(' '))}`;
  }

  // Range syntax: Take 3-4 clean anchor words for start and end
  const startWords = words.slice(0, 4).map(cleanWord).filter(Boolean);
  const endWords = words.slice(-4).map(cleanWord).filter(Boolean);

  const textStart = startWords.join(' ');
  const textEnd = endWords.join(' ');

  if (!textStart) {
    return cleanBase;
  }

  if (!textEnd || textStart === textEnd) {
    return `${cleanBase}#:~:text=${encodeURIComponent(textStart)}`;
  }

  return `${cleanBase}#:~:text=${encodeURIComponent(textStart)},${encodeURIComponent(textEnd)}`;
}
