'use client';

import * as React from 'react';

import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { formatInlineCitations } from '@/lib/citations';
import type { ChatCitation } from '@/lib/sse';

/**
 * Chat answers are LLM output, so they get the full Markdown surface: GFM
 * tables, blockquotes, lists, inline code and fenced code blocks with a copy
 * button - instead of the old hand-rolled subset that leaked raw backticks.
 *
 * Citation markers are rewritten to readable source labels before Markdown
 * rendering, e.g. `[1]` becomes `*(Git Lab Guide.pdf - Page 8)*`.
 */
export function ChatMarkdown({
  content,
  citations = [],
}: {
  content: string;
  citations?: ChatCitation[];
}) {
  const formatted = React.useMemo(
    () => formatInlineCitations(content, citations),
    [content, citations],
  );

  return <MarkdownContent content={formatted} className="chat-markdown" />;
}
