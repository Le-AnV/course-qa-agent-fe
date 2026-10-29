import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./MarkdownContent";

function render(content: string | null | undefined): string {
  return renderToStaticMarkup(React.createElement(MarkdownContent, { content }));
}

describe("MarkdownContent", () => {
  it("renders bold and italic instead of raw markers", () => {
    const html = render("**Learn** _fast_");
    expect(html).toContain("<strong");
    expect(html).toContain("<em");
    expect(html).not.toContain("**Learn**");
  });

  it("renders GFM unordered and ordered lists", () => {
    const unordered = render("- one\n- two");
    expect(unordered).toContain("<ul");
    expect(unordered).toContain(">one</li>");

    const ordered = render("1. first\n2. second");
    expect(ordered).toContain("<ol");
    expect(ordered).toContain(">first</li>");
  });

  it("renders headings and paragraphs", () => {
    const html = render("## Schedule\n\nFirst paragraph.\n\nSecond paragraph.");
    expect(html).toContain("<h2");
    expect(html).toContain("First paragraph.</p>");
    expect(html).toContain("Second paragraph.</p>");
  });

  it("keeps single line breaks", () => {
    const html = render("Room 204\nOnline via Google Meet");
    expect(html).toContain("<br");
    expect(html).toContain("Room 204");
    expect(html).toContain("Online via Google Meet");
  });

  it("renders links as safe new-tab links", () => {
    const html = render("[Course docs](https://example.com/docs)");
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("drops unsafe URLs instead of emitting them", () => {
    const html = render("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("skips raw HTML instead of injecting it", () => {
    const html = render("Before <script>alert(1)</script> after **safe**");
    expect(html).not.toContain("<script");
    expect(html).toContain("<strong");
  });

  it("renders long content without truncating it", () => {
    const long = `Start ${"x".repeat(5000)} END`;
    const html = render(long);
    expect(html.length).toBeGreaterThan(5000);
    expect(html).toContain("END");
  });

  it("renders fenced code as a dark card with a copy button", () => {
    const html = render("```python\nprint('hi')\n```");
    expect(html).toContain("bg-[#1B1B1B]");
    expect(html).toContain("python");
    expect(html).toContain("Copy");
    expect(html).toContain("print");
    expect(html).not.toContain("```");
  });

  it("renders inline code without leaking backticks", () => {
    const html = render("Run `npm run dev` first");
    expect(html).toContain("<code");
    expect(html).not.toContain("`npm run dev`");
  });

  it("renders fenced code without a language", () => {
    const html = render("```\nplain text\n```");
    expect(html).toContain("bg-[#1B1B1B]");
    expect(html).toContain("plain text");
  });

  it("renders nothing for empty content", () => {
    expect(render("")).toBe("");
    expect(render(null)).toBe("");
    expect(render("   ")).toBe("");
  });
});
