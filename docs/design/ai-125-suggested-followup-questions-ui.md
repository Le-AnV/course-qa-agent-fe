# UI Design & Implementation Specs — Suggested Follow-up Questions (AI-125)

> **Ticket:** [AI-125](https://ai03.atlassian.net/browse/AI-125)
> **Epic:** E4 — RAG Q&A (Contextual Chat)
> **Repo:** `course-qa-agent-fe`
> **Target branch:** `features/Implementation_SuggestedFollowUpQuestions`
> **Status:** Implemented (UI & streaming integration)

This document is the frontend design reference for **Suggested Follow-up Questions (AI-125)**.
It specifies the interaction flows, SSE stream integration, and UI states for post-answer follow-up question pills.

---

## 1. Overview & Objectives

In AI-125:
1. **Empty Chat State:**
   When entering a class chat (`/teacher/class/[id]/agent` or `/student/class/[id]/agent`), no starter questions are generated or shown. The chat begins clean without predefined prompts.
2. **Post-Answer State (Follow-up Questions):**
   Once a student or trainer sends a question and the assistant completes an answer grounded in course materials, the backend generates and streams **2–3 relevant follow-up questions** via SSE (`event: suggestions` and inside `event: done`).
3. **Pill Display & Interaction:**
   The follow-up questions are displayed using interactive pill buttons:
   ```html
   class="rounded-full border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#5A5A5A] hover:border-[#CFCFCF] hover:text-[#111111] transition-colors"
   ```
4. **Seamless Conversation Continuation:**
   Clicking any follow-up question immediately submits it as the next question in the active session, hiding the suggestions and initiating standard answer retrieval.

---

## 2. Scope & File Structure

| Area | File | Change |
|---|---|---|
| SSE protocol | `lib/sse.ts` | Support `event: suggestions` and `suggestedQuestions` on `event: done` |
| Streaming hook | `hooks/use-chat-stream.ts` | Expose `onSuggestions` callback in `useChatStream` |
| UI Component | `features/chat/suggested-questions.tsx` | Reusable pill list with styling and click handling |
| Chat Surface | `features/chat/chat-window.tsx` | Wire `onSuggestions`, store per-answer suggestions, conditional render |
| History Types | `features/history/types.ts` | `suggested_questions` on `ChatMessageItem` |
| Unit Tests | `lib/sse.test.ts`, `features/chat/suggested-questions.test.tsx` | Unit tests for parser and UI component |

---

## 3. UI Styling & Visual Design

Follow-up suggestions render directly under the completed AI answer bubble:
```
+-------------------------------------------------------------+
|  Chat window                                                |
|                                                             |
|  [ Q: What are convolutional neural networks? ]             |
|  [ A: A CNN is a class of deep neural network... [1] ]      |
|     Sources: [1] Lecture_04_CNN.pdf                         |
|                                                             |
|  Suggested follow-ups:                                      |
|  ( How does pooling work in CNNs? )                         |
|  ( What is the role of ReLU in conv layers? )               |
|                                                             |
|  [ Ask a follow-up...                                 Send ]|
+-------------------------------------------------------------+
```

---

## 4. Acceptance Criteria Mapping

| ID | Criteria | Frontend Implementation |
|---|---|---|
| **AC-01** | Chat displays 2–3 suggested follow-up questions related to question, answer, and retrieved context. | Rendered via `<SuggestedQuestions>` directly under completed assistant message when `suggestedQuestions` is present. |
| **AC-02** | Suggestions match student language and class materials. | Backend LLM prompt guarantees language and context; frontend renders questions as provided. |
| **AC-03** | Suggestions not shown when context is insufficient. | If `suggestedQuestions` is empty or undefined, `<SuggestedQuestions>` returns `null` (no empty containers). |
| **AC-04** | Selecting a suggestion sends it as a new message in the same conversation. | Clicking calls `handleSend(question)` which uses the normal session and message flow. |
| **AC-05** | Suggestions are hidden while streaming or if the answer failed. | Render condition requires `!isStreaming && !isTyping && !lastMessage.isError && lastMessage.role === 'ai'`. |

---

## 5. Verification Summary

* `lib/sse.test.ts`: 12 tests passed (validating `event: suggestions` and `suggested_questions` in `event: done`).
* `features/chat/suggested-questions.test.tsx`: 5 tests passed (verifying pill styling and click handling).
* Total frontend test suite: 19 test files, 121 tests passing.
* Production build (`next build`) and linter (`next lint`) pass with 0 errors.
