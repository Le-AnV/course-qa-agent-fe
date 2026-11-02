import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

describe("MarkdownEditor", () => {
  it("renders the formatting toolbar and the current value", () => {
    const html = renderToStaticMarkup(
      React.createElement(MarkdownEditor, {
        id: "info-note",
        value: "# Welcome",
        onChange: () => {},
      }),
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain("Heading");
    expect(html).toContain("Bold");
    expect(html).toContain("Preview");
    expect(html).toContain('id="info-note"');
    expect(html).toContain("# Welcome");
  });
});
