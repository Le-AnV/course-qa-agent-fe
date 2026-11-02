import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/dialog", () => {
  const passthrough = ({ children }: { children: ReactNode }) => <>{children}</>;
  return {
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <>{children}</> : null,
    DialogContent: passthrough,
    DialogDescription: passthrough,
    DialogFooter: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
  };
});
import { AskTeacherButton } from "./ask-teacher-button";

describe("AskTeacherButton", () => {
  it("hides the ticket action until answer text is selected", () => {
    const html = renderToStaticMarkup(
      <AskTeacherButton classId="class-1" question="How does this work?" />,
    );

    expect(html).not.toContain("Ask my teacher");
    expect(html).not.toContain("Create ticket");
  });

  it("shows a floating action next to the selected text without opening the form", () => {
    const html = renderToStaticMarkup(
      <AskTeacherButton classId="class-1" question="How does this work?"
        selection={{ text: "the selected explanation", left: 140, top: 80 }} />,
    );

    expect(html).toContain("Ask my teacher");
    expect(html).toContain("left:140px");
    expect(html).toContain("top:80px");
    expect(html).not.toContain("Create ticket");
  });
});
