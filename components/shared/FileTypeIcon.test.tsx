import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FileTypeIcon, fileExtension, fileTypeKind } from "./FileTypeIcon";

function render(fileName: string): string {
  return renderToStaticMarkup(React.createElement(FileTypeIcon, { fileName }));
}

describe("FileTypeIcon", () => {
  it("reads extensions case-insensitively and ignores URL suffixes", () => {
    expect(fileExtension("Syllabus.PDF?token=1")).toBe("pdf");
    expect(fileExtension("README")).toBe("");
  });

  it("maps common file extensions to a visual kind", () => {
    expect(fileTypeKind("grades.xlsx")).toBe("spreadsheet");
    expect(fileTypeKind("slides.pptx")).toBe("presentation");
    expect(fileTypeKind("diagram.png")).toBe("image");
    expect(fileTypeKind("archive.zip")).toBe("archive");
    expect(fileTypeKind("main.py")).toBe("code");
    expect(fileTypeKind("syllabus.pdf")).toBe("pdf");
    expect(fileTypeKind("lecture.mp4")).toBe("video");
    expect(fileTypeKind("recording.mp3")).toBe("audio");
    expect(fileTypeKind("notes.unknown")).toBe("document");
  });

  it("renders a matching icon for the file kind", () => {
    expect(render("grades.xlsx")).toContain('data-file-kind="spreadsheet"');
    expect(render("syllabus.pdf")).toContain('data-file-kind="pdf"');
    expect(render("slides.pptx")).toContain("lucide-presentation");
    expect(render("diagram.png")).toContain("lucide-file-image");
  });
});
