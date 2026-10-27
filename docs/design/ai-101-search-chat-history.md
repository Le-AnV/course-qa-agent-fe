# UI/UX Design & Interaction Specs — Search Chat History (AI-101)

> **Ticket:** [AI-101](https://ai03.atlassian.net/browse/AI-101)  
> **Epic:** AI-93 (Chat History & Memory) · **Story Points:** 5 SP · **Priority:** Medium  
> **Repo:** `course-qa-agent-fe`  
> **Target branch:** `main` (features branch: `features/Design_SearchChatHistory`)  
> **Status:** Design  
> **Related Stories:** AI-59 (Student Chat Interface), AI-95 (Chat History & Sidebar UI), AI-97 (Reopen Conversation), AI-99 (Delete Chat History).

This document establishes the user interface design, responsive layouts, interaction flow, accessibility requirements, and component specifications for **AI-101: Search Chat History**.

> **Figma Note:** No dedicated standalone Figma artboard was issued for this ticket because it seamlessly extends the established chat layout, Radix Dialog primitives, Lucide icons, and Tailwind styling tokens standardized in AI-59, AI-95, and AI-99. This design specification serves as the formal design deliverable for the Design branch according to the team's GitLab Workflow Guide (§3.2.1).

---

## 1. Overview & Acceptance Criteria (AC) Mapping

Students frequently generate dozens of exploratory queries across multiple topics during a semester. Finding a previously answered question requires either tedious manual scrolling or remembering exact timestamps. AI-101 introduces an instant keyword search bar within the conversation sidebar that searches across both conversation titles and individual message contents with real-time keyword highlighting.

### Acceptance Criteria Mapping

| AC ID | Jira Criterion | Frontend Component & Implementation Strategy |
|---|---|---|
| **AC-01** | Search by keyword in titles & message contents | `searchSessions(query, classId)` API client triggers `GET /api/history/search`. Returns title & message matches scoped to current user. |
| **AC-02** | Row-level security (RLS) isolation | Inherited from Backend JWT auth. Client sends Bearer token with all requests via `apiFetch`. Cross-user data is impossible to display. |
| **AC-03** | Preview snippet with highlighted keyword | `splitHighlightParts()` helper splits text into matching tokens rendered with semantic `<mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">`. Snippet is hidden if identical to title. |
| **AC-04** | Empty state when no matches found | When `searchResults` is an empty array (`[]`), render an accessible "No results found" placeholder with `Search` icon and muted caption. |
| **AC-05** | Click result to navigate to conversation | Clicking a search result item calls `selectSession(result.session_id)`, clears search state, and (on mobile) automatically closes the drawer. |

---

## 2. Component Scope & File Changes

| File | Change Type | Responsibility |
|---|:---:|---|
| `features/history/types.ts` | Update | Add `SearchResultItem` and `ChatSearchResponse` TypeScript interfaces. |
| `features/history/api.ts` | Update | Add `searchSessions(query, classId, limit, offset)` using existing `apiFetch<ChatSearchResponse>`. |
| `features/history/search-highlight.ts` | **Create** | Pure helper function `splitHighlightParts(text, keyword)` for unit-tested token splitting and regex escaping. |
| `features/history/search-highlight.test.ts` | **Create** | Unit tests for highlight token splitting, casing, and regex safety. |
| `features/history/search-api.test.ts` | **Create** | Unit tests for `searchSessions` API client param construction and defaults. |
| `features/history/chat-history-sidebar.tsx` | Update | Integrate `renderSearchBox()` into Desktop `<aside>` and Mobile drawer `<DialogContent>`, manage debounced search state, request cancellation, and result rendering. |
| `docs/design/ai-101-search-chat-history.md` | **Create** | This formal UI/UX design specification document. |

---

## 3. Wireframes & Layout

### 3.1. Desktop Sidebar (Expanded Mode — `w-64`)

The search input is pinned at the top of the history list, immediately beneath the sidebar header:

```text
+----------------------------------------------------+
|  Chat History                              [+] [<] |
+----------------------------------------------------+
|  [🔍 Search conversations...                  [✕]] |
+----------------------------------------------------+
|  2 results                                         |
|  Thuật toán BFS                                    |
|  ...giải thích sự khác biệt giữa BFS và DFS...     |
|----------------------------------------------------|
|  Recursion in Python                               |
|  ...cách hoạt động của hàm đệ quy trong BFS...     |
+----------------------------------------------------+
```

### 3.2. Mobile Drawer (`DialogContent` — `< md`)

On mobile viewports, the search bar is mirrored directly inside `<DialogContent>` right above the scrollable transcript container:

```text
+----------------------------------------------------+
|  Chat History                              [+] [✕] |
+----------------------------------------------------+
|  [🔍 Search conversations...                  [✕]] |
+----------------------------------------------------+
|  2 results                                         |
|  Thuật toán BFS                                    |
|  ...giải thích sự khác biệt giữa BFS và DFS...     |
+----------------------------------------------------+
```

### 3.3. Desktop Rail (Collapsed Mode — `w-16`)

When the sidebar is collapsed into rail mode, the search input is hidden (`!isCollapsed`). Clicking the collapse toggle (`ChevronRight`) expands the sidebar, immediately revealing the search input.

---

## 4. Interactive States & Component Behavior

```
User types in SearchBox
         │
         ├── Query is empty / cleared ──────► Reset to normal conversation list (searchResults = null)
         │
         ▼ (Debounce 300ms + searchRequestId increment)
Loading State: Display 2 animated Skeleton cards
         │
         ├── API Success (results > 0) ─────► Render list with highlighted keywords & result count
         │
         ├── API Success (results == 0) ────► Render "No results found" empty state
         │
         └── API Error / Network down ──────► Render Error state with message & [Retry] button
```

| State | Trigger / Condition | UI Display & Interactions |
|---|---|---|
| **Idle (Default)** | `searchQuery === ''` | Search input shows placeholder `"Search conversations..."`. History sidebar renders normal chronological session list (`states()`). Clear button (`X`) is hidden. |
| **Typing / Debouncing** | User typing, timer active (< 300ms) | Clear button (`X`) appears. No network call fired yet. Previous results or session list remains stable until timer expires. |
| **Searching (Loading)** | Timer expires, API in flight | Two `<Skeleton className="h-12 w-full rounded-lg" />` placeholders pulse. `aria-busy="true"` is set on container. |
| **Search Results** | `searchResults.length > 0` | Result count header `"N results"`. Each item displays: Title (bold, 12.5px), Snippet (muted, 11px, 2-line clamp). Matched keyword is highlighted with `<mark>`. Clicking row selects session and resets search query. |
| **No Results** | `searchResults.length === 0` | Centered layout with muted `Search` icon (`h-7 w-7 text-[#CFCFCF]`) and text `"No results found"` in `text-[12px] text-[#6F6F6F]`. |
| **Search Error** | Network failure or API non-200 | Centered alert with `AlertCircle` icon, human-readable error text, and a `[Retry]` button with `RefreshCw` icon to re-trigger query. |

---

## 5. Technical Safeguards & UX Decisions

### 5.1. 300ms Debounce Strategy
To eliminate server load from excessive keystroke requests, `useEffect` employs a 300ms timeout before invoking `searchSessions()`.

### 5.2. Race Condition Prevention (Request ID Ref Counter)
In asynchronous search, a user typing `cat` followed quickly by `dog` can trigger two in-flight requests. If `cat` resolves *after* `dog`, the outdated `cat` results would overwrite the `dog` results.
* **Solution:** We maintain a `searchRequestId = React.useRef(0)`.
* Every keystroke increments `requestId = ++searchRequestId.current`.
* Upon resolution, the response is discarded if `requestId !== searchRequestId.current`.
* Unmounting or clearing input immediately increments the ref to invalidate pending promises.

### 5.3. Search Keyword Highlighting & Regex Safety
User input may contain regex metacharacters such as `?`, `*`, `+`, `(`, `[`, `%`. Passing unescaped input to `RegExp` crashes JavaScript runtime.
* **Safety:** `splitHighlightParts()` replaces metacharacters via `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before splitting.
* Match comparison is case-insensitive (`'gi'`).

### 5.4. Mobile Drawer Coordination
Clicking a search result inside the mobile drawer calls `selectSession(result.session_id)`, which executes both `onSelectSession(id)` and `onMobileOpenChange?.(false)`, automatically dismissing the drawer and revealing the selected chat session.

---

## 6. Accessibility (A11y) & Design System Compliance

* **Role & Labelling:** The search container has `role="search"`. The input element includes `aria-label="Search conversations"` and `type="search"`.
* **Live Regions:** The result container uses `aria-live="polite"` and `aria-busy={isSearching}` so screen readers announce result count changes without interrupting active voice.
* **Keyboard Navigation:** 
  * `Tab` cycles from Search input ➔ Clear button ➔ Search result items.
  * `Enter` on a focused result item activates navigation.
  * Clear button includes `aria-label="Clear search"`.
* **Semantic Highlighting:** Highlights use `<mark>` rather than plain `<span>` to convey semantic emphasis to assistive technologies.
* **Color Contrast:**
  * Background mark: `bg-yellow-100` (`#FEF9C3`) with text `text-yellow-900` (`#713F12`), yielding a contrast ratio of > 8.5:1 (well exceeding WCAG AA 4.5:1).
  * Input border: `#DADADA`, text: `#111111`, placeholder: `#9F9F9F`.

---

## 7. Frontend Automated Test Plan

### 7.1. Unit Tests (`Vitest`)

* **`search-highlight.test.ts`:**
  1. `splits case-insensitively`: Verifies `"BFS and bfs"` with query `"bfs"` yields 2 matches and 1 non-match.
  2. `escapes regex special characters`: Verifies `"100% done"` with query `"%"`, and `"c++"` with query `"++"` do not crash and match accurately.
  3. `returns single non-match for empty keyword`: Verifies blank/whitespace returns original text unmodified.
* **`search-api.test.ts`:**
  1. `builds query params with class, limit and offset`: Asserts `apiFetch` called with `/api/history/search?q=BFS&class_id=...&limit=10&offset=20`.
  2. `omits class_id when not provided`: Asserts `class_id` omitted from URL query string when undefined.

### 7.2. Manual E2E Scenarios

| Scenario | Steps | Expected Result |
|---|---|---|
| **Desktop Title Search** | Type `"BFS"` in desktop sidebar | Results appear in ~300ms. Title displays with highlighted `"BFS"`. |
| **Desktop Message Search** | Type keyword located only in a message | Session appears with excerpt snippet and highlighted keyword. |
| **Mobile Drawer Search** | Open drawer on viewport < 768px, search `"BFS"`, click result | Result opens chat, search clears, drawer closes automatically. |
| **Clear Search** | Click `(X)` icon in search box | Search box clears, sidebar returns to full chronological session list. |
| **Network Error / Retry** | Disconnect network or block API, type keyword | Error message displayed with `[Retry]` button. Reconnecting and clicking `[Retry]` restores results. |
