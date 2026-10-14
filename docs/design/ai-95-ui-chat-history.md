# UI Design & Implementation Specs — Save & Display Chat History (AI-95)

> **Ticket:** [AI-95](https://ai03.atlassian.net/browse/AI-95)  
> **Epic:** E7 — Chat History & Memory  
> **Status:** Implemented (UI & Client Integration)  

This document serves as the UI Design Specifications and integration reference detailing the component architecture, layout states, user interactions, and API contracts built for **Saving & Displaying Chat History** across `features/Design_SaveChatHistory` and `features/Implementation_SaveChatHistory`.

---

## 1. UI Overview & Layout

The AI Learning Assistant interface at `/student/class/[id]/agent` is structured around a **3-Column App Window Layout** to optimize workspace clarity and user focus:

1. **Left Column — Chat History Sidebar (`w-80` / `20rem`):**
   - Dedicated panel managing the student's conversation history for the current course.
   - Quick "New Chat" action (`+` icon button) in the header.
   - Independent vertical scrolling list (`overflow-y-auto`) displaying session titles, humanized relative timestamps, active state indicators, and a delete action with confirmation modal dialog.
2. **Center Column — Chat Window Container (`flex-1`):**
   - Primary conversation window rendering historical message transcripts and the real-time input area.
   - Automatically loads and displays the full conversation history when a session is selected from the sidebar (AC-07).
   - Features a blinking cursor pulse (`animate-pulse`) trailing streamed AI responses.
3. **Right Column — Course Context & Syllabus (`w-80`):**
   - Displays course details, topic syllabus, and reference material context.

---

## 2. Component Architecture

All UI components are modularized under `features/history/` and seamlessly integrated with `features/chat/`:

```
features/
├── history/
│   ├── types.ts                   # DTO interfaces matching Backend Pydantic schemas 1-to-1 (strict typing, zero `any`)
│   ├── api.ts                     # API client consuming `/api/history` endpoints (via `apiFetch` with Bearer auth)
│   └── chat-history-sidebar.tsx   # Sidebar component supporting 4 mandatory UI states and delete confirmation modal
└── chat/
    ├── chat-window.tsx            # Accepts `activeSessionId`, fetches message transcripts, manages auto-scroll
    └── message-bubble.tsx         # Renders message bubbles with loading animation and streaming typing cursor
```

### 2.1. `chat-history-sidebar.tsx`
- **Component Props:**
  - `classId: string`: Course ID used to scope chat history per course.
  - `activeSessionId: string | null`: The currently active session ID.
  - `onSelectSession: (sessionId: string) => void`: Callback triggered when a user selects a session item.
  - `onNewChat: () => void`: Callback triggered when a user clicks the "New Chat" button.

- **New Chat Action:**
  - A persistent "New Chat" action (plus icon button) allows students to reset `activeSessionId` to `null`, clearing the chat window to initiate a fresh question turn.

- **Relative Time Formatting:**
  - Humanized relative timestamps: `"Just now"`, `"X minutes ago"`, `"X hours ago"`, `"Yesterday"`, or formatted date `dd/MM/yyyy`.

- **4 Mandatory UI States:**
  1. **Loading State:** Displays a 3-row skeleton placeholder (`components/ui/skeleton.tsx`) while session data is being fetched from the backend.
  2. **Empty State:** When no sessions exist for the course, displays an empty message icon with the prompt: *"No conversations yet. Start a new chat by asking a question!"*.
  3. **Error State:** In case of network errors or server downtime, displays an error alert with a **"Retry"** button to refetch history without reloading the page.
  4. **Success State (AC-06):** Renders the list of session items sorted chronologically descending by `updated_at` (newest first). The currently active session is visually highlighted.

- **Delete Confirmation Modal Dialog (AC-05):**
  - Clicking the trash icon (`Trash2`) does not immediately delete the record. Instead, it triggers an alert modal dialog (`Dialog` from `@/components/ui/dialog`).
  - Modal content:
    - Title: *"Delete this conversation?"*
    - Description: *"This action cannot be undone. All messages in this conversation will be permanently removed."*
  - On confirmation:
    - Sends `DELETE /api/history/{id}`.
    - Immediately removes the session from local state (optimistic update).
    - If the deleted session was currently active, resets `activeSessionId` to `null`.
    - Triggers a feedback toast notification (`toast.success("Conversation deleted successfully")`).

---

### 2.2. `chat-window.tsx` & `message-bubble.tsx`
- **Transcript Loading (AC-07):**
  - When `activeSessionId` updates to a valid UUID, the component activates an `isLoadingHistory` indicator and fetches data via `getSessionDetail(activeSessionId)`.
  - A centered loading spinner is displayed while fetching message transcripts.
  - Maps `ChatMessageItem[]` into the internal message state, preserving chronological order (`created_at ASC`).
- **AI Typing Cursor Animation:**
  - While AI text is streaming (`isStreaming = true`), an inline pulsing bar (`inline-block w-2 h-4 ml-1 bg-primary align-middle animate-pulse`) blinks at the end of the text stream to emulate real-time typewriter output.

---

## 3. Data Flow & API Contract (Frontend Integration)

All communication between Frontend and Backend adheres to the **Contract-First** principle:

```
[Student Interaction]
       │
       ├──> Click Session ──> GET /api/history/{session_id} ──> Load messages into ChatWindow (AC-07)
       │
       ├──> Click "+"      ──> Set activeSessionId = null   ──> Switch to fresh conversation
       │
       ├──> Click Delete   ──> Open Confirmation Dialog     ──> DELETE /api/history/{session_id} (AC-05)
       │
       └──> Mount Page     ──> GET /api/history?class_id=... ──> Display newest sessions first (AC-06)
```

### 3.1. TypeScript DTO Interfaces (`features/history/types.ts`)
```typescript
export interface ChatSessionItem {
  id: string;
  title: string | null;
  updated_at: string;
  class_id?: string | null;
  message_count?: number;
}

export interface ChatMessageItem {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  used_web_search: boolean;
  created_at: string;
}

export interface ChatSessionDetail {
  session_id: string;
  title: string | null;
  messages: ChatMessageItem[];
}
```

### 3.2. Endpoints Contract

1. **List Course Sessions:**
   - **Method / Path:** `GET /api/history?class_id={uuid}`
   - **Headers:** `Authorization: Bearer <access_token>`
   - **Query Parameters:** `class_id` (only appended if valid UUID format to prevent FastAPI 422 Unprocessable Entity on mock route params).
   - **Response (200 OK):** Array of `ChatSessionItem[]`, sorted by `updated_at DESC`.

2. **Retrieve Session Transcript:**
   - **Method / Path:** `GET /api/history/{session_id}`
   - **Headers:** `Authorization: Bearer <access_token>`
   - **Response (200 OK):** `ChatSessionDetail` object containing messages ordered by `created_at ASC`.

3. **Delete Session:**
   - **Method / Path:** `DELETE /api/history/{session_id}`
   - **Headers:** `Authorization: Bearer <access_token>`
   - **Response (200 OK):** `{ "success": true, "message": "Session deleted successfully" }`
   - **Backend Effect:** Cascades deletion in PostgreSQL (`chat_message` records) and purges corresponding vector points from Qdrant `content_gap_queries`.

---

## 4. Acceptance Criteria Verification

| Criteria | Specification | Frontend Implementation |
|---|---|---|
| **AC-05** | Deleting session purges all records without orphans | Protected with confirmation modal dialog; dispatches `DELETE /api/history/{id}`; updates UI immediately and shows toast confirmation. |
| **AC-06** | Sidebar lists sessions sorted newest first | Consumes `GET /api/history`; renders session items with relative timestamps sorted by `updated_at` descending. |
| **AC-07** | Opening session accurately loads message history | Dispatches `GET /api/history/{id}`; renders loading spinner during fetch; populates full chronological transcripts into `ChatWindow`. |
