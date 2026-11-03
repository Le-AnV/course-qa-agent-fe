# AI-43 — Class material preview and download (UI design)

**Status:** Draft for review
**Related:** AI-35 (materials upload), AI-37 (materials list), AI-39 (delete/replace), AI-41 (class tags), AI-43 (this task)
**Implementation branch:** `features/Implementation_TicketEscalationAndPreview`

---

## 1. Scope

AI-43 adds **Preview** and **Download** actions to the trainer class materials table and a
focused preview dialog for PDF and image files.

In scope:

- Preview an authorized material without leaving the class syllabus page.
- Download the original file with its original filename.
- Keep the existing table, filters, status badges, upload, approve, reject, delete, and
  replace flows unchanged.
- Show inline errors when preview/download fails.

Out of scope:

- Student access to trainer materials.
- Public share links or signed URLs.
- Editing, converting, or annotating files.
- Thumbnails or server-side preview generation.
- Bulk download.

---

## 2. Surface

| Surface | Route | Component |
|---|---|---|
| Trainer class materials | `/teacher/class/[id]/syllabus` | `ClassMaterials` |

The actions appear in the existing per-row action cell, aligned right with the current
table actions.

---

## 3. Row actions

### Visibility

| Condition | Preview | Download |
|---|---|---|
| `status === "replaced"` | Hidden | Hidden |
| MIME is `application/pdf` or `image/*` | Shown | Shown |
| Other MIME type | Hidden | Shown |
| Missing/unknown MIME | Hidden | Shown |

Preview is limited to types the browser can render safely. Unsupported formats still
download normally.

### Styling

- Small outlined buttons matching the existing table actions:
  white background, `#CFCFCF` border, 11.5px semibold text, compact padding.
- Disabled at 50% opacity while the row is busy.
- Download label changes to `Downloading…` while its request is in flight.
- Preview and download are disabled while a delete/replace/load operation is running
  for that row.
- Buttons are right-aligned and wrap cleanly on narrow tables.

### Behaviour

- **Preview** fetches the file with the Bearer token, creates an object URL, and opens
  the preview dialog.
- **Download** fetches the file with the Bearer token, creates a temporary object URL,
  clicks a hidden anchor with the original filename, then revokes the URL.
- A missing token redirects to `/login`.
- A `401` response redirects to `/login`.
- Other failures leave the table usable and show an inline error above the table:
  - `Preview failed: <detail>`
  - `Download failed: <detail>`

No public `backendUrl` file link is rendered.

---

## 4. Preview dialog

The dialog uses the existing `Dialog` primitives.

### Header

- Title: original file name.
- Description: “Preview of the uploaded material. Only authorized trainers can open
  this file.”

### Body

| MIME type | Renderer |
|---|---|
| `application/pdf` | `<iframe>` with `title="Preview of <file name>"` |
| `image/*` | `<img>` with the file name as `alt` |

- Max height: `70vh`; width 100%; object-contain for images.
- Rounded border matching the existing panel style.
- No raw file path, storage URL, or token is shown.

### Footer

- **Close** closes the dialog and revokes the object URL.
- **Download** downloads the same file from the dialog.

Closing via Escape or the overlay uses the same cleanup path and revokes the object URL.
Opening another preview revokes the previous URL before replacing it.

---

## 5. States and edge cases

| State | Behaviour |
|---|---|
| File loads | Dialog shows the PDF/image. |
| Preview request fails | Inline `Preview failed` error; dialog does not open. |
| Download fails | Inline `Download failed` error; row returns to idle. |
| Token missing/expired | Redirect to `/login`. |
| Unsupported type | No Preview button; Download still works. |
| Replaced material | Both actions hidden. |
| File missing on server | API `404`; inline error, no path leaked. |
| Large PDF | Dialog uses the full 70vh viewport; browser handles scrolling. |
| Long file name | Title wraps without overflowing the dialog. |
| Multiple previews | Previous object URL is revoked; no blob leak. |
| Delete/replace in flight | Row actions disabled to avoid conflicting requests. |

---

## 6. Accessibility

- Buttons use explicit text labels; no icon-only actions.
- Disabled state is programmatic (`disabled`), not colour-only.
- The dialog has a title and description and traps focus through the existing Radix
  primitive.
- Escape closes the dialog; focus returns to the trigger.
- The PDF iframe has a descriptive `title`; the image has meaningful `alt` text.
- Download progress is announced by the `Downloading…` label.
- Keyboard users can reach Preview, Download, Close, and the dialog Download button.

---

## 7. API mapping

| UI action | API |
|---|---|
| Preview | `GET /api/documents/{id}/preview` with `Authorization: Bearer <token>` |
| Download | `GET /api/documents/{id}/download` with `Authorization: Bearer <token>` |

Both requests use `fetch` and read the response as a `Blob`. The UI does not embed the
API URL in an `<a href>` or `<iframe src>` directly; the authenticated blob is used
locally.

Backend contract:
`course-qa-agent-be/docs/design/ai-43-class-material-preview-api.md`

---

## 8. AC mapping

| Acceptance criterion | UI surface |
|---|---|
| AC-01: preview class material | Preview action + PDF/image dialog. |
| AC-02: download original file | Download action + dialog Download; original filename preserved. |
| AC-03: authorized trainer only | Bearer fetch; 401 redirect; 403 inline error. |
| Unsupported type | No Preview button; Download remains. |
| Missing file | Inline error from API `404`; no public path. |

---

## 9. Verification checklist

- [ ] A PDF row shows Preview and Download; both succeed.
- [ ] An image row shows Preview and renders in the dialog.
- [ ] A DOCX/Markdown row shows Download only.
- [ ] A replaced row shows neither action.
- [ ] Download preserves the original filename and byte count.
- [ ] Preview failure shows an inline error and leaves the table usable.
- [ ] Download failure shows an inline error and resets the button label.
- [ ] Closing the dialog and opening another preview revokes the previous blob URL.
- [ ] Keyboard-only preview/download/close works; focus returns to the trigger.
- [ ] Expired token redirects to `/login`.
- [ ] Playwright smoke covers preview, dialog, and download for a seeded PDF.

---

## 10. Attachments

- Figma: not created for this task; the design follows the existing class materials
  table and dialog patterns.
- API design: `course-qa-agent-be/docs/design/ai-43-class-material-preview-api.md`.
- OpenAPI: FastAPI `/docs` after backend deployment.
- UX flow: table action → authenticated blob fetch → dialog or browser download.

---

## 11. Open decisions

1. **Image uploads:** the API supports `image/*`, but the current upload allow-list is
   document-focused. The UI is ready for image rows even if they are not produced by the
   current upload form.
2. **Blob revocation:** the download helper revokes the object URL immediately after the
   anchor click. Safari may need a delayed revoke; this is not changed in AI-43.
3. **Preview fidelity:** PDF rendering depends on the browser's built-in viewer; no
   PDF.js or server-side thumbnail is added.
