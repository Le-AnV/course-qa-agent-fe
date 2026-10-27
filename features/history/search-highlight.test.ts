import { describe, expect, it } from "vitest";
import { splitHighlightParts } from "./search-highlight";

describe("splitHighlightParts", () => {
  it("splits case-insensitively", () => {
    expect(splitHighlightParts("BFS and bfs", "bfs")).toEqual([
      { text: "BFS", match: true },
      { text: " and ", match: false },
      { text: "bfs", match: true },
    ]);
  });

  it("escapes regex special characters", () => {
    expect(splitHighlightParts("100% done", "%")).toEqual([
      { text: "100", match: false },
      { text: "%", match: true },
      { text: " done", match: false },
    ]);
  });

  it("returns a single non-match for empty keyword", () => {
    expect(splitHighlightParts("BFS", "   ")).toEqual([
      { text: "BFS", match: false },
    ]);
  });
});
