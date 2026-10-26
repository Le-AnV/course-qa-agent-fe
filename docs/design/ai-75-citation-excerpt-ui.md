# AI-75 — Click a Citation to View Source Excerpt (Frontend UI)

> **Ticket:** AI-75 (Epic E5) · **Status:** Implemented
> **Branch:** `features/Implementation_Citations`
> **Related components:** `features/citations/citation-chip.tsx`, `features/citations/url-helper.ts`.

## Purpose

Enables students to click any citation chip to open an informative excerpt popover tooltip revealing the original source passage, relevant keyword highlights, and direct actions to open the referenced class document.

## UI Features & Components

1. **`CitationChip` Excerpt Popover (`features/citations/citation-chip.tsx`):**
   - Renders interactive source pills (e.g. `[1] CS101_Lecture3.pdf (p. 14)`).
   - Clicking triggers a rich Popover tooltip:
     - Displays document name, chapter, and page metadata.
     - Renders the exact text excerpt from the retrieved chunk.
     - Highlights matched keywords to show relevance to the student's question.
     - Provides an "Open Original Document" action.

2. **Universal Text Fragment Navigation (`features/citations/url-helper.ts`):**
   - Generates compliant W3C text fragment URLs (`#:~:text=start,end`) to navigate web sources and HTML documents with native browser text highlighting.

3. **PDF Rect Overlay Support:**
   - Communicates with `POST /api/chat/sources/{document_id}/rects` to overlay visual highlight boxes directly onto the client PDF document viewer.
