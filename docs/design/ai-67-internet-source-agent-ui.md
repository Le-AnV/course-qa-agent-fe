# AI-67 — Internet Source Agent UI

> **Ticket:** AI-67 (Epic E4) · **Status:** Implemented
> **Branch:** `features/Implementation_Citations`
> **Related components:** `features/citations/internet-source-badge.tsx`, `features/chat/thinking-trace.tsx`.

## Purpose

Provides distinct visual styling and badge labeling for answers produced by the Internet Source Agent, ensuring students immediately understand that an answer originated from the public web rather than approved class materials.

## UI Components & Behavior

1. **`InternetSourceBadge` (`features/citations/internet-source-badge.tsx`):**
   - Renders a prominent pill badge labeled `Internet source` with a globe / external link icon.
   - Provides direct, secure links to the cited external webpage (`target="_blank" rel="noopener noreferrer"`).
   - Applied in both inline response text and message footers whenever `citation.kind === "internet"`.

2. **`ThinkingTrace` Integration (`features/chat/thinking-trace.tsx`):**
   - Displays real-time SSE progress events specifically indicating external search:
     - `Searching the web`
     - `Reviewing N web sources`
     - `Synthesizing answer`
   - Prevents student confusion by showing transparent step-by-step progress while external web queries are in flight.
