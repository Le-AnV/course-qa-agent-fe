# AI-73 — Automatic Citations UI

> **Ticket:** AI-73 (Epic E5) · **Status:** Implemented
> **Branch:** `features/Implementation_Citations`
> **Related components:** `lib/sse.ts`, `lib/citations.ts`, `features/chat/message-bubble.tsx`.

## Purpose

Parses and renders structured citations streamed over SSE, associating in-text superscript markers `[k]` with corresponding citation cards and pills below assistant messages.

## UI Implementation

1. **SSE Citation Parsing (`lib/sse.ts`):**
   - Decodes `citation` events into typed `ChatCitation` objects containing `index`, `kind`, `title`, `documentId`, `page`, and `snippet`.
   - Defaults `indexes` and `highlights` arrays to safe fallbacks.

2. **Deduplication & Grouping (`lib/citations.ts`):**
   - `citationKey(citation)`: Unique key based on document ID and page number to prevent duplicate display of identical cited pages.
   - `mergeCitation(existing, citation)`: Deduplicates streaming events seamlessly.

3. **Message Rendering (`features/chat/message-bubble.tsx`):**
   - Renders a clean "Sources" tray below each grounded assistant response.
   - Formats citation pills with document name and page/slide coordinates.
