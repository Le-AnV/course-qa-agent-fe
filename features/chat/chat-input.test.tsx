import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatInput } from "./chat-input";

type Quota = { limit: number | null; used: number; remaining: number | null; resets_at: string | null };

function render(quota: Quota | null) {
  return renderToStaticMarkup(
    React.createElement(ChatInput, { onSend: () => {}, chatLayout: true, quota })
  );
}

describe("ChatInput quota gating", () => {
  it("blocks typing when the daily limit is reached", () => {
    const html = render({ limit: 20, used: 20, remaining: 0, resets_at: null });
    expect(html).toContain('aria-disabled="true"');
  });

  it("keeps the composer enabled for unlimited roles", () => {
    const html = render({ limit: null, used: 0, remaining: null, resets_at: null });
    expect(html).toContain('aria-disabled="false"');
    expect(html).not.toContain("questions left today");
  });
});
