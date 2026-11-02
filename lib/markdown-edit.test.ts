import { describe, expect, it } from "vitest";
import { applyMarkdownFormat } from "./markdown-edit";

describe("applyMarkdownFormat", () => {
  it("wraps a selection in bold markers", () => {
    expect(applyMarkdownFormat({ value: "hello", start: 0, end: 5 }, "bold")).toEqual({
      value: "**hello**",
      start: 2,
      end: 7,
    });
  });

  it("inserts a bold placeholder when nothing is selected", () => {
    expect(applyMarkdownFormat({ value: "", start: 0, end: 0 }, "bold")).toEqual({
      value: "**bold text**",
      start: 2,
      end: 11,
    });
  });

  it("prefixes the current line with a heading marker", () => {
    expect(
      applyMarkdownFormat({ value: "Title\nBody", start: 2, end: 2 }, "heading"),
    ).toEqual({
      value: "## Title\nBody",
      start: 5,
      end: 5,
    });
  });

  it("prefixes every selected line for a bullet list", () => {
    expect(
      applyMarkdownFormat({ value: "one\ntwo", start: 0, end: 7 }, "bullet"),
    ).toEqual({
      value: "- one\n- two",
      start: 2,
      end: 11,
    });
  });

  it("wraps a selection as a link and selects the URL", () => {
    expect(applyMarkdownFormat({ value: "docs", start: 0, end: 4 }, "link")).toEqual({
      value: "[docs](https://)",
      start: 7,
      end: 15,
    });
  });
});
