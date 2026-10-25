# AI-77 — Citations Chapter and Page Navigation UI

> **Ticket:** AI-77 (Epic E5) · **Status:** Implemented
> **Branch:** `features/Implementation_Citations`
> **Related components:** `features/citations/citation-chip.tsx`, `features/citations/types.ts`.

## Purpose

Displays precise chapter, slide, or page number coordinates in citation chips and links, enabling students to jump directly to the target location in class slides or PDF materials.

## UI Features

1. **Structured Location Formatting:**
   - Detects whether citation metadata points to a `page`, `slide`, or `chapter`.
   - Displays clear human-readable pills, e.g.:
     - `Slide 14 — Chapter 3: OOP Basics`
     - `p. 25 — Calculus_Workbook.pdf`

2. **Direct Page Navigation:**
   - Appends page anchor parameters (`#page=N`) when opening PDF documents in the browser or viewer, opening the document directly at the cited page.
