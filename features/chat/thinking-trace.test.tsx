import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThinkingTrace } from "./thinking-trace";

const STEPS = ["Searching class materials", "Reviewing matching sections", "Synthesizing answer"];

function render(props: Partial<React.ComponentProps<typeof ThinkingTrace>> = {}) {
  return renderToStaticMarkup(
    React.createElement(ThinkingTrace, {
      steps: STEPS,
      running: true,
      ...props,
    })
  );
}

describe("ThinkingTrace", () => {
  it("shows only the current stage while running", () => {
    const html = render({ activeStep: 1 });

    expect(html).toContain("Reviewing matching sections");
    expect(html).not.toContain("Searching class materials");
    expect(html).toContain("thinking-stage");
  });

  it("removes the stage line once the answer starts", () => {
    expect(render({ running: false })).toBe("");
  });

  it("removes the stage line after completion", () => {
    expect(render({ completed: true })).toBe("");
  });
});
