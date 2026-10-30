import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MessageBubble } from "./message-bubble";

const ERROR_TEXT = "The answer could not be generated. Please try again.";

function render(props: Partial<React.ComponentProps<typeof MessageBubble>> = {}) {
  return renderToStaticMarkup(
    React.createElement(MessageBubble, {
      role: "ai",
      content: ERROR_TEXT,
      renderMarkdown: false,
      ...props,
    })
  );
}

describe("MessageBubble error retry", () => {
  it("offers a retry action on an error bubble", () => {
    const html = render({ isError: true, onRetry: vi.fn() });

    expect(html).toContain(ERROR_TEXT);
    expect(html).toContain('aria-label="Retry question"');
  });

  it("omits the retry action when no handler is wired", () => {
    const html = render({ isError: true });

    expect(html).toContain(ERROR_TEXT);
    expect(html).not.toContain('aria-label="Retry question"');
  });

  it("never shows a retry action on a successful answer", () => {
    const html = render({ content: "Here is the answer.", onRetry: vi.fn() });

    expect(html).not.toContain('aria-label="Retry question"');
  });
});
