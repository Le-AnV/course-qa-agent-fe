import { describe, expect, it } from "vitest";
import { studentApi } from "./student-api";

function mockFetch(calls: { url: string; init?: RequestInit }[], body: unknown) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

describe("class template copy", () => {
  it("lists approved documents for a source class", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, [
      { id: "doc-1", file_name: "lesson.pdf", file_type: ".pdf", size_bytes: 2048, version: 1 },
    ]);
    try {
      const docs = await studentApi.templateDocuments("class-2", "class-1");
      expect(docs[0].file_name).toBe("lesson.pdf");
      expect(calls[0].url).toContain(
        "/api/classes/class-2/template-documents?source_class_id=class-1",
      );
      expect(calls[0].init?.method).toBeUndefined();
    } finally {
      restore();
    }
  });

  it("sends the selected config, info fields and documents to the copy endpoint", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, {
      config: { class_id: "class-2" },
      info: { class_id: "class-2" },
      copied_documents: [],
      skipped_documents: [{ file_name: "old.pdf", reason: "Already exists." }],
    });
    try {
      const result = await studentApi.copyTemplate("class-2", "class-1", ["doc-1"], {
        copyConfig: false,
        infoFields: ["description", "meeting_url"],
      });
      expect(result.skipped_documents[0].file_name).toBe("old.pdf");
      expect(calls[0].url).toContain("/api/classes/class-2/template-copy");
      expect(calls[0].init?.method).toBe("POST");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({
        source_class_id: "class-1",
        document_ids: ["doc-1"],
        copy_config: false,
        info_fields: ["description", "meeting_url"],
      });
    } finally {
      restore();
    }
  });
});
