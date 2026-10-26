# AI-65 — Retrieval Threshold Admin UI & Test Query Sandbox

> **Ticket:** AI-65 (Epic E4) · **Status:** Implemented
> **Location:** `app/(shell)/admin/settings/page.tsx`
> **Related stories:** AI-65 (BE retrieval threshold), AI-107 (Embedding & Retrieval Configuration).

## Purpose

Provides administrators with an intuitive interface to configure dual answer routing thresholds ($T_{high}$ and $T_{low}$), select pre-calibrated threshold presets, and test query sensitivity against real indexed class documents in a live sandbox panel.

## Key Features

1. **Dual Threshold Sliders & Precise Inputs:**
   - **Curriculum Confidence Threshold ($T_{high}$):** Minimum similarity score (default `0.80`) required to answer from course materials.
   - **Out-of-Scope Filter Threshold ($T_{low}$):** Lower bound similarity score (default `0.45`) below which questions are rejected immediately as off-topic.
   - Live constraint validation ensuring $0.0 \le T_{low} \le T_{high} \le 1.0$.

2. **Pre-calibrated Presets:**
   - **Conservative:** High precision ($T_{high} = 0.85, T_{low} = 0.50$), strictly answers from slides.
   - **Balanced (Default):** Optimal trade-off ($T_{high} = 0.80, T_{low} = 0.45$).
   - **Aggressive:** Wider internet fallback ($T_{high} = 0.70, T_{low} = 0.35$).

3. **Live Test Query Sandbox (`POST /api/admin/retrieval-config/test`):**
   - Allows admins to select a class and execute test questions.
   - Displays real-time decision badge (`Curriculum`, `Internet`, or `Unrelated / Refused`).
   - Shows top cosine similarity score, matching document names, and chunk text snippets.

## Component Architecture

- `app/(shell)/admin/settings/page.tsx`: Contains the Retrieval Configuration Card and the Test Query Sandbox.
- `lib/admin-api.ts`: API client functions `getRetrievalConfig()`, `updateRetrievalConfig()`, and `testRetrievalConfig()`.
- `lib/admin-api.test.ts`: Unit test suite covering threshold serialization, updates, and query sandbox responses.
