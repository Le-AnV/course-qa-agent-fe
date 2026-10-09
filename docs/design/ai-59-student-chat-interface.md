# UI Design & Implementation Specs — Student Chat Interface (AI-59)

> **Ticket:** AI-59
> **Epic:** E4 - Contextual Q&A
> **Status:** Implemented (UI & Client Logic)

This document serves as the Design Specs and a hand-over reference detailing the architecture and components built in the `Implementation_StudentChatInterface` branch. The purpose is to provide context and guidance for future tasks (especially backend API integration).

## 1. UI Overview

The Chat Interface is designed as a standalone "App Window" occupying the remaining height of the AppShell (`calc(100dvh - 8rem)`).
- Only the message list area is allowed to scroll (`overflow-y-auto`).
- The input area is firmly docked to the bottom.
- This layout prevents the entire page from stretching and scrolling when the conversation gets long.

## 2. Component Architecture

All UI components are located in `features/chat/` (flat, no nested `components/` — same convention as `features/login/`).

### 2.1. `chat-window.tsx` (Parent Container)
- Acts as the main wrapper for the Chat Interface.
- **State Management:** Manages the `messages` array and the `isTyping` state.
- **Logic:** Implements auto-scroll functionality (scrolling to the bottom whenever a new message arrives) using `useRef` and `scrollIntoView`.
- **Integration Note (Task AI-95):** Currently initialized with a mock `INITIAL_MESSAGES` array (containing one welcome message). Future task AI-95 will replace this by fetching the actual message history via a `GET /api/history` endpoint.

### 2.2. `message-bubble.tsx` (Message Bubble)
- **Styling:** 
  - User: Right-aligned, dark background (slate-900), white text.
  - AI: Left-aligned, light background (white), black text with a subtle border.
- **Loading State (AC-04):** When passed `isLoading={true}`, the AI bubble renders a bouncing 3-dot animation (`animate-bounce` with staggered delays).
- **Citations Placeholder:** A designated `<div>` is placed at the bottom of the AI bubble. It currently holds a placeholder text `[1] Nguồn tài liệu`. The E5 Epic team will later inject their Citation Component into this slot.

### 2.3. `chat-input.tsx` (Input Area)
- Uses a `<textarea>` that automatically expands its height (up to 200px) when typing multiple lines.
- **Key Bindings (AC-03):** 
  - `Enter`: Prevents default behavior (new line) and triggers the Send function.
  - `Shift + Enter`: Retains default behavior (inserts a new line naturally).
- The Send button is disabled when the input is empty or when the system is busy (Streaming).

## 3. Data & Streaming Flow

To fulfill the **AC-02 (Answers stream character by character)** requirement, a custom Hook has been implemented at: `hooks/use-chat-stream.ts`

### Mechanism:
1. **Trigger:** User clicks Send -> Calls `sendMessage(text)`.
2. **Initialization:** The Parent Component adds 1 User bubble and 1 empty AI bubble to the state, and enables the Loading animation (3 dots).
3. **API Connection:** The Hook executes a `fetch` request to the endpoint (currently mocked as `POST /api/chat`).
4. **Stream Consumption:** Uses `response.body.getReader()` and `TextDecoder('utf-8')` to decode the byte stream into strings.
5. **UI Update:** Upon receiving a new text chunk, the Hook calls `onChunk()`, disables the loading dots, and appends the new text to the end of the empty AI bubble.

### Notes for the Backend Team:
- Ensure the API response follows standard **Server-Sent Events (SSE)** or chunked transfer encoding.
- The `fetch` URL in `use-chat-stream.ts` is temporarily hard-coded as `'/api/chat'`. The Backend team must finalize the official URL and update it accordingly.

## 4. API Design Contract (Backend Handoff)

To align with the Team Leader's standard for Design branches, below is the expected API contract that the Frontend is currently configured to consume.

### 4.1. Send Message (Streaming)
- **Endpoint:** `POST /api/chat`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Request Body (JSON):**
  ```json
  {
    "message": "Thi giữa kỳ có bao nhiêu câu hỏi vậy bạn?"
  }
  ```
- **Response (200 OK - `text/event-stream` or `transfer-encoding: chunked`):**
  The response body must be a continuous byte stream. The Frontend's `TextDecoder` will decode raw text chunks as they arrive and append them directly to the chat bubble.
  *(Example chunks arriving over time: `["Dựa vào ", "đề cương ", "môn học..."]`)*
