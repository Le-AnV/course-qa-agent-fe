import { describe, it, expect } from 'vitest';
import type { CitationItem } from './types';
import { buildUniversalJumpUrl } from './url-helper';

describe('Citations Schema & Type contracts', () => {
  it('correctly constructs curriculum citation items', () => {
    const item: CitationItem = {
      citation_id: 1,
      source_type: 'curriculum',
      document_name: 'CS101_Syllabus_2026.pdf',
      document_type: 'pdf',
      file_url: 'https://example.com/file.pdf',
      location: {
        page_number: 3,
        slide_number: null,
        paragraph_index: null,
      },
      highlight_quote: 'điểm thi thực hành kết thúc học phần chiếm 60%',
      jump_url: null,
    };

    expect(item.citation_id).toBe(1);
    expect(item.source_type).toBe('curriculum');
    expect(item.location.page_number).toBe(3);
    expect(item.document_type).toBe('pdf');
  });

  it('correctly constructs external internet citation items with W3C text fragment', () => {
    const quote = 'Dennis Ritchie between 1972 and 1973';
    const baseUrl = 'https://en.wikipedia.org/wiki/C_(programming_language)';
    const item: CitationItem = {
      citation_id: 2,
      source_type: 'internet',
      document_name: 'C - Wikipedia',
      document_type: 'web',
      location: {
        page_number: null,
        slide_number: null,
        paragraph_index: null,
      },
      highlight_quote: quote,
      jump_url: `${baseUrl}#:~:text=${encodeURIComponent(quote)}`,
    };

    expect(item.citation_id).toBe(2);
    expect(item.source_type).toBe('internet');
    expect(item.jump_url).toContain('#:~:text=');
    expect(item.jump_url).toContain('Dennis%20Ritchie');
  });

  it('buildUniversalJumpUrl generates valid W3C text fragment with range directive', () => {
    const baseUrl = 'https://en.wikipedia.org/wiki/C_(programming_language)';
    const snippet = 'C was originally developed by Dennis Ritchie between 1972 and 1973 at Bell Labs.';
    
    const url = buildUniversalJumpUrl(baseUrl, snippet);
    expect(url).toContain('#:~:text=');
    expect(url).toContain('C%20was%20originally%20developed');
    expect(url).toContain('1973%20at%20Bell%20Labs');
    // Ensure clean url without punctuation
    expect(url).not.toContain('Labs.');
  });

  it('buildUniversalJumpUrl handles short snippets and empty inputs safely', () => {
    expect(buildUniversalJumpUrl('https://example.com', '')).toBe('https://example.com');
    expect(buildUniversalJumpUrl('https://example.com', null)).toBe('https://example.com');
    expect(buildUniversalJumpUrl('https://example.com', 'Dennis Ritchie')).toBe('https://example.com#:~:text=Dennis%20Ritchie');
  });

  it('determines fallback web target URL when fragment is missing or present', () => {
    const rawUrl = 'https://example.com/guide';
    const snippet = 'Install the package with npm install.';
    
    // Missing fragment: should augment with snippet
    const targetUrl = !rawUrl.includes('#:~:text=') && !rawUrl.includes('google.com/goto')
      ? buildUniversalJumpUrl(rawUrl, snippet) || rawUrl
      : rawUrl;
    expect(targetUrl).toContain('#:~:text=');

    // Already has fragment: should keep original
    const existingFragmentUrl = 'https://example.com/guide#:~:text=custom';
    const preservedUrl = !existingFragmentUrl.includes('#:~:text=') && !existingFragmentUrl.includes('google.com/goto')
      ? buildUniversalJumpUrl(existingFragmentUrl, snippet) || existingFragmentUrl
      : existingFragmentUrl;
    expect(preservedUrl).toBe(existingFragmentUrl);

    // Google redirect: should keep original
    const googleGotoUrl = 'https://www.google.com/goto?url=CAESabc';
    const googleTarget = !googleGotoUrl.includes('#:~:text=') && !googleGotoUrl.includes('google.com/goto')
      ? buildUniversalJumpUrl(googleGotoUrl, snippet) || googleGotoUrl
      : googleGotoUrl;
    expect(googleTarget).toBe(googleGotoUrl);
  });
});
