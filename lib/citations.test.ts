import { describe, expect, it } from "vitest";

import {
  citationKey,
  formatInlineCitations,
  mapHistoryCitation,
  mergeCitation,
  normalizeCitationUrl,
  uniqueCitations,
} from "./citations";
import type { ChatCitation } from "./sse";

function citation(overrides: Partial<ChatCitation> = {}): ChatCitation {
  return {
    index: 1,
    kind: "curriculum",
    title: "Quiz.pdf",
    url: null,
    snippet: "Question 6",
    documentId: "doc-quiz",
    page: 1,
    indexes: [1],
    highlights: [],
    ...overrides,
  };
}

describe("citation helpers", () => {
  it("makes provider-relative Google redirects absolute", () => {
    const token = "/goto?url=CAESabc";
    expect(normalizeCitationUrl(token)).toBe("https://www.google.com/goto?url=CAESabc");
    expect(normalizeCitationUrl("goto?url=CAESabc")).toBe(
      "https://www.google.com/goto?url=CAESabc",
    );
    expect(normalizeCitationUrl("//www.google.com/goto?url=CAESabc")).toBe(
      "https://www.google.com/goto?url=CAESabc",
    );
    expect(normalizeCitationUrl("https://example.com/article")).toBe(
      "https://example.com/article",
    );
    expect(normalizeCitationUrl(null)).toBeNull();
  });

  it("keeps the same document and page distinct from another source with the same index", () => {
    const quiz = citation();
    const logistics = citation({ title: "Logistics.pdf", documentId: "doc-logistics" });

    expect(citationKey(quiz)).not.toBe(citationKey(logistics));
  });

  it("does not append an identical streamed citation twice", () => {
    const existing = [citation()];
    const result = mergeCitation(existing, citation());

    expect(result).toBe(existing);
  });

  it("appends a citation with the same index but a different document", () => {
    const result = mergeCitation(
      [citation()],
      citation({ title: "Logistics.pdf", documentId: "doc-logistics" }),
    );

    expect(result).toHaveLength(2);
  });

  it("deduplicates persisted history while preserving order", () => {
    const first = citation();
    const second = citation({ index: 2, title: "Logistics.pdf", documentId: "doc-logistics" });

    expect(uniqueCitations([first, first, second])).toEqual([first, second]);
  });

  it("renders citation markers as italic source labels", () => {
    const result = formatInlineCitations("A fact [1].", [citation()]);

    expect(result).toBe("A fact *(Quiz.pdf - Page 1)*.");
  });

  it("groups adjacent markers and keeps unknown markers", () => {
    const result = formatInlineCitations(
      "Both [1][2] and an unknown [9].",
      [
        citation({ index: 1, title: "Git Lab Guide.pdf", page: 8, indexes: [1] }),
        citation({ index: 2, title: "Git Lab Guide.pdf", page: 9, indexes: [2] }),
      ],
    );

    expect(result).toBe(
      "Both *(Git Lab Guide.pdf - Page 8; Git Lab Guide.pdf - Page 9)* and an unknown [9].",
    );
  });

  it("leaves citation-like text inside code untouched", () => {
    const content = "Use `items[1]` in code.\n\n```ts\nconst x = items[1];\n```\n\nFact [1].";

    expect(formatInlineCitations(content, [citation()])).toBe(
      "Use `items[1]` in code.\n\n```ts\nconst x = items[1];\n```\n\nFact *(Quiz.pdf - Page 1)*.",
    );
  });
});

describe("mapHistoryCitation", () => {
  it("maps persisted citation fields to ChatCitation", () => {
    const mapped = mapHistoryCitation({
      index: 1,
      kind: "curriculum",
      title: "Lecture 1.pdf",
      url: "//cdn.example.com/doc",
      snippet: "Key definition",
      document_id: "doc-123",
      page: 4,
      indexes: [1, 3],
      highlights: ["Highlight 1", "Highlight 2"],
    });

    expect(mapped).toEqual({
      index: 1,
      kind: "curriculum",
      title: "Lecture 1.pdf",
      url: "https://cdn.example.com/doc",
      snippet: "Key definition",
      documentId: "doc-123",
      page: 4,
      indexes: [1, 3],
      highlights: ["Highlight 1", "Highlight 2"],
    });
  });

  it("falls back indexes to [index] when indexes array is missing or empty", () => {
    const withEmpty = mapHistoryCitation({
      index: 2,
      kind: "internet",
      title: "Docs",
      url: "https://example.com",
      snippet: "Web snippet",
      document_id: null,
      page: null,
      indexes: [],
    });
    expect(withEmpty.indexes).toEqual([2]);

    const withUndefined = mapHistoryCitation({
      index: 3,
      kind: "internet",
      title: "Docs",
      url: "https://example.com",
      snippet: "Web snippet",
      document_id: null,
      page: null,
    });
    expect(withUndefined.indexes).toEqual([3]);
  });

  it("never converts snippet into highlight when highlights is empty", () => {
    const mapped = mapHistoryCitation({
      index: 1,
      kind: "curriculum",
      title: "Doc.pdf",
      url: null,
      snippet: "Raw snippet preview",
      document_id: "doc-1",
      page: 1,
      highlights: [],
    });

    expect(mapped.snippet).toBe("Raw snippet preview");
    expect(mapped.highlights).toEqual([]);
  });

  it("uses highlights[0] as snippet fallback when snippet is empty", () => {
    const mapped = mapHistoryCitation({
      index: 1,
      kind: "curriculum",
      title: "Doc.pdf",
      url: null,
      snippet: "   ",
      document_id: "doc-1",
      page: 1,
      highlights: ["Primary source passage", "Secondary passage"],
    });

    expect(mapped.snippet).toBe("Primary source passage");
  });
});
