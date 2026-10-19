import { describe, expect, it } from "vitest";
import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE_BYTES,
  acceptedExtensions,
  applyMockFallback,
  deleteDocument,
  formatFileSize,
  replaceNameError,
  resolveDefaultClassId,
  validationError,
  type ClassOption,
  type DocumentFilters,
  type DocumentItem,
} from "./documents";

function file(name: string, size: number): Pick<File, "name" | "size"> {
  return { name, size };
}

const ALL: DocumentFilters = { search: "", classId: "all", fileType: "all", status: "all" };

const DOCS: DocumentItem[] = [
  {
    id: "doc-1",
    fileName: "syllabus.pdf",
    fileType: ".pdf",
    mimeType: "application/pdf",
    sizeBytes: 245760,
    uploaderId: "trainer-1",
    classId: "class-a",
    className: "CS101 - Class A",
    status: "indexed",
    version: 1,
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    id: "doc-2",
    fileName: "week1-slides.pptx",
    fileType: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sizeBytes: 5242880,
    uploaderId: "trainer-1",
    classId: "class-a",
    className: "CS101 - Class A",
    status: "pending",
    version: 1,
    createdAt: "2026-10-08T14:30:00Z",
  },
  {
    id: "doc-3",
    fileName: "notes.txt",
    fileType: ".txt",
    mimeType: "text/plain",
    sizeBytes: 512,
    uploaderId: "trainer-2",
    classId: "class-b",
    className: "CS101 - Class B",
    status: "failed",
    version: 1,
    createdAt: "2026-10-09T10:00:00Z",
  },
];

describe("acceptedExtensions", () => {
  it("matches the 7 accepted material formats", () => {
    expect(acceptedExtensions()).toEqual(
      ACCEPTED_TYPES.map((t) => t.extension),
    );
    expect(acceptedExtensions()).toHaveLength(7);
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

describe("resolveDefaultClassId (AI-41, AC-01)", () => {
  const classes: ClassOption[] = [
    { id: "class-a", name: "CS101 - Class A", code: "CS101-A" },
    { id: "class-b", name: "CS101 - Class B", code: "CS101-B" },
  ];

  it("keeps the current class when it still exists", () => {
    expect(resolveDefaultClassId(classes, "class-b")).toBe("class-b");
  });

  it("falls back to the first class when current is stale", () => {
    expect(resolveDefaultClassId(classes, "class-mock")).toBe("class-a");
  });

  it("falls back to the first class when current is empty", () => {
    expect(resolveDefaultClassId(classes, "")).toBe("class-a");
  });

  it("returns empty string when there are no classes (blocks upload)", () => {
    expect(resolveDefaultClassId([], "class-a")).toBe("");
  });
});

describe("applyMockFallback (AI-37)", () => {
  it("returns everything when filters are all", () => {
    const { items, total } = applyMockFallback(DOCS, ALL, 1, 10);
    expect(total).toBe(3);
    expect(items).toHaveLength(3);
  });

  it("searches by file name case-insensitively", () => {
    const { items, total } = applyMockFallback(
      DOCS,
      { ...ALL, search: "  SYLLABUS " },
      1,
      10,
    );
    expect(total).toBe(1);
    expect(items[0].id).toBe("doc-1");
  });

  it("filters by class, type and status", () => {
    expect(
      applyMockFallback(DOCS, { ...ALL, classId: "class-b" }, 1, 10).total,
    ).toBe(1);
    expect(
      applyMockFallback(DOCS, { ...ALL, fileType: ".pdf" }, 1, 10).total,
    ).toBe(1);
    expect(
      applyMockFallback(DOCS, { ...ALL, status: "pending" }, 1, 10)
        .items[0].id,
    ).toBe("doc-2");
  });

  it("paginates and returns empty items past the last page", () => {
    const p1 = applyMockFallback(DOCS, ALL, 1, 2);
    expect(p1.items.map((d) => d.id)).toEqual(["doc-1", "doc-2"]);
    expect(p1.total).toBe(3);
    const p2 = applyMockFallback(DOCS, ALL, 2, 2);
    expect(p2.items.map((d) => d.id)).toEqual(["doc-3"]);
    expect(applyMockFallback(DOCS, ALL, 3, 2).items).toEqual([]);
  });

  it("filters replaced versions after AI-39", () => {
    const withReplaced: DocumentItem[] = [
      { ...DOCS[0], id: "doc-v2", version: 2, status: "processing" },
      { ...DOCS[0], id: "doc-v1", version: 1, status: "replaced" },
    ];
    const { items, total } = applyMockFallback(
      withReplaced,
      { ...ALL, status: "replaced" },
      1,
      10,
    );
    expect(total).toBe(1);
    expect(items[0].id).toBe("doc-v1");
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
