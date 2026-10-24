import { describe, expect, it } from "vitest";

import { citationKey, mergeCitation, uniqueCitations } from "./citations";
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
});
