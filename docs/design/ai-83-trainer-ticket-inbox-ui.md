# AI-83 — Trainer ticket inbox UI design

## Location and scope

Render the live ticket inbox in the existing teacher class tickets route. Keep the selected class from the route as the initial class filter. This page lists and reads tickets; answering and resolving them belong to separate tasks.

## Layout and behavior

- Header identifies the class inbox and its purpose.
- Filter controls allow `All`, `Open`, `Answered`, and `Resolved`, plus the current class selection where available.
- List rows show ticket ID, question, student, class, status, and creation time. Newest tickets appear first, matching server order.
- Selecting a row shows the question and optional assistant-answer excerpt. Do not expose tickets outside the current trainer's assigned classes.
- Provide previous/next pagination and a visible result count. Reset to page 1 when filters change.
- Keep the existing two-pane inbox pattern on wide screens; on narrow screens, allow list/detail navigation without horizontal overflow.

## States and accessibility

Support loading, empty inbox, no filter matches, API error with retry, and populated states. Use labeled filter controls, semantic buttons for rows and pagination, visible focus, and status text that does not rely on color alone. Preserve a sensible selection when page/filter data refreshes; otherwise show an instruction to choose a ticket.

## Data contract

Call `GET /api/tickets` with `class_id`, optional status, page, and page size. Trust the returned `items`, `total`, `page`, and `page_size` for pagination. The server enforces role and class ownership; the UI is not an authorization boundary.

## Verification

Verify each status filter, class scoping, newest-first display, page boundaries, empty and error states, keyboard operation, and narrow-screen layout. Confirm that trainer A cannot see trainer B's tickets by requesting another class ID; the server must reject it.
