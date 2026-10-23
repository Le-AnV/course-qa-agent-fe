import { describe, expect, it } from "vitest";
import { paginate } from "./pagination";

const rows = Array.from({ length: 25 }, (_, i) => i + 1);

describe("paginate", () => {
  it("returns the first 10 rows", () => {
    expect(paginate(rows, 1)).toEqual({ items: rows.slice(0, 10), page: 1, pageCount: 3 });
  });

  it("returns the remainder on the last page", () => {
    expect(paginate(rows, 3).items).toEqual(rows.slice(20));
  });

  it("clamps a page below the first page", () => {
    expect(paginate(rows, 0).page).toBe(1);
  });

  it("clamps a page past the end", () => {
    expect(paginate(rows, 99).page).toBe(3);
  });

  it("keeps an empty list on page 1 of 1", () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});
