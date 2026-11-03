import { describe, expect, it } from "vitest";
import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE_BYTES,
  acceptedExtensions,
  canPreviewDocument,
  deleteDocument,
  fetchDocumentFile,
  formatFileSize,
  rejectDocument,
  replaceNameError,
  retryDocument,
  validationError,
} from "./documents";

function file(name: string, size: number): Pick<File, "name" | "size"> {
  return { name, size };
}

describe("acceptedExtensions", () => {
  it("matches the 6 accepted material formats", () => {
    expect(acceptedExtensions()).toEqual(
      ACCEPTED_TYPES.map((t) => t.extension),
    );
    expect(acceptedExtensions()).toHaveLength(6);
    expect(acceptedExtensions()).not.toContain(".csv");
  });
});

describe("validationError (AI-35)", () => {
  it("accepts a valid file", () => {
    expect(validationError(file("syllabus.pdf", 1024))).toBeNull();
  });

  it("is case-insensitive on extension", () => {
    expect(validationError(file("SLIDES.PPTX", 1024))).toBeNull();
  });

  it("rejects an invalid format", () => {
    expect(validationError(file("setup.exe", 1024))).toContain("invalid format");
  });

  it("rejects a file without extension", () => {
    expect(validationError(file("README", 1024))).toContain("invalid format");
  });

  it("rejects a file over 100MB", () => {
    expect(
      validationError(file("big.pdf", MAX_FILE_SIZE_BYTES + 1)),
    ).toContain("exceeds 100MB");
  });

  it("accepts a file of exactly 100MB", () => {
    expect(validationError(file("edge.pdf", MAX_FILE_SIZE_BYTES))).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("replaceNameError (AI-39 AC-03)", () => {
  const current = { fileName: "syllabus.pdf" };

  it("accepts the same name, case-insensitively", () => {
    expect(replaceNameError(current, { name: "syllabus.pdf" })).toBeNull();
    expect(replaceNameError(current, { name: "SYLLABUS.PDF" })).toBeNull();
  });

  it("rejects a different name (it would create a new document)", () => {
    expect(replaceNameError(current, { name: "other.pdf" })).toContain(
      "syllabus.pdf",
    );
    expect(replaceNameError(current, { name: "notes.txt" })).toContain(
      "new document",
    );
  });
});

describe("deleteDocument (AI-39 AC-01)", () => {
  it("calls DELETE with confirm=true and maps the response", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          deleted: "doc-1",
          file_name: "syllabus.pdf",
          version: 2,
          purged_chunks: 5,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const result = await deleteDocument({ token: "t" }, "doc-1");
      expect(result).toEqual({
        deleted: "doc-1",
        fileName: "syllabus.pdf",
        version: 2,
        purgedChunks: 5,
      });
      expect(calls[0].url).toContain("/api/documents/doc-1?confirm=true");
      expect(calls[0].init?.method).toBe("DELETE");
      expect(
        (calls[0].init?.headers as Record<string, string>).Authorization,
      ).toBe("Bearer t");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("surfaces the backend error detail", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ detail: "Document not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    try {
      await expect(deleteDocument({ token: "t" }, "gone")).rejects.toThrow(
        "Document not found.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("retryDocument (AI-55)", () => {
  it("posts to the retry endpoint and maps the failure reason", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          id: "doc-1",
          file_name: "lesson.pdf",
          file_type: ".pdf",
          mime_type: "application/pdf",
          size_bytes: 100,
          uploader_id: "user-1",
          class_id: "class-1",
          class_name: "AI Class",
          status: "processing",
          failure_reason: null,
          version: 1,
          created_at: "2026-10-19T00:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const result = await retryDocument({ token: "t" }, "doc-1");
      expect(result.status).toBe("processing");
      expect(result.failureReason).toBeNull();
      expect(calls[0].url).toContain("/api/documents/doc-1/retry");
      expect(calls[0].init?.method).toBe("POST");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("canPreviewDocument (AI-43 AC-01)", () => {
  it("previews PDFs and images only", () => {
    expect(canPreviewDocument({ mimeType: "application/pdf" })).toBe(true);
    expect(canPreviewDocument({ mimeType: "image/png" })).toBe(true);
    expect(canPreviewDocument({ mimeType: "image/jpeg" })).toBe(true);
    expect(canPreviewDocument({ mimeType: "text/plain" })).toBe(false);
    expect(
      canPreviewDocument({
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(false);
  });
});

describe("fetchDocumentFile (AI-43)", () => {
  it("fetches the preview blob with the bearer token", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response("%PDF-1.4", {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      });
    }) as typeof fetch;
    try {
      const blob = await fetchDocumentFile({ token: "t" }, "doc-1", "preview");
      expect(await blob.text()).toBe("%PDF-1.4");
      expect(calls[0].url).toContain("/api/documents/doc-1/preview");
      expect(
        (calls[0].init?.headers as Record<string, string>).Authorization,
      ).toBe("Bearer t");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses the download endpoint and surfaces backend errors", async () => {
    const calls: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request) => {
      calls.push(String(url));
      return new Response(
        JSON.stringify({ detail: "This file type cannot be previewed" }),
        { status: 415, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      await expect(
        fetchDocumentFile({ token: "t" }, "doc-2", "download"),
      ).rejects.toThrow("This file type cannot be previewed");
      expect(calls[0]).toContain("/api/documents/doc-2/download");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("rejectDocument (AI-55)", () => {
  it("posts to the reject endpoint and maps the rejected status", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          id: "doc-1",
          file_name: "lesson.pdf",
          file_type: ".pdf",
          mime_type: "application/pdf",
          size_bytes: 100,
          uploader_id: "user-1",
          class_id: "class-1",
          class_name: "AI Class",
          status: "rejected",
          failure_reason: null,
          version: 1,
          created_at: "2026-10-19T00:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const result = await rejectDocument({ token: "t" }, "doc-1");
      expect(result.status).toBe("rejected");
      expect(calls[0].url).toContain("/api/documents/doc-1/reject");
      expect(calls[0].init?.method).toBe("POST");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
