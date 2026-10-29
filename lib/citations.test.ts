import { describe, expect, it } from "vitest";

import { citationKey, formatInlineCitations, mergeCitation, uniqueCitations } from "./citations";
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
