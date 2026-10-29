import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { studentApi } from "./student-api";

describe("studentApi.syllabusRoadmap (AI-133)", () => {
  it("fetches the class syllabus roadmap with units and topic outline", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          class_id: "class-1",
          document_id: "doc-1",
          file_name: "02-rag-and-optimization-Syllabus-ver1.1.xlsx",
          topic_outline: "Unit 01: Tokenization, Quantization, Advanced Indexing\nUnit 02: Hybrid Search",
          units: [
            {
              id: "u1",
              unit_number: 1,
              unit_title: "Advanced Indexing",
              description: "2 sessions · OS1",
              content:
                "### Session 1\n- **Concept/Lecture** (180 min · Self Learning · OS1)\n  - Tokenization: Revise tokenization and usecases\n  - Quantization: Core concept and Algorithms",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      const roadmap = await studentApi.syllabusRoadmap("class-1");
      expect(calls[0].url).toContain("/api/student/classes/class-1/syllabus");
      expect(roadmap.class_id).toBe("class-1");
      expect(roadmap.file_name).toBe("02-rag-and-optimization-Syllabus-ver1.1.xlsx");
      expect(roadmap.topic_outline).toContain("Unit 01: Tokenization");
      expect(roadmap.units).toHaveLength(1);
      expect(roadmap.units[0].unit_number).toBe(1);
      expect(roadmap.units[0].unit_title).toBe("Advanced Indexing");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles empty syllabus state when class has no approved syllabus", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          class_id: "class-empty",
          document_id: null,
          file_name: null,
          topic_outline: null,
          units: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const roadmap = await studentApi.syllabusRoadmap("class-empty");
      expect(roadmap.document_id).toBeNull();
      expect(roadmap.topic_outline).toBeNull();
      expect(roadmap.units).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("ChatMarkdown syllabus content rendering (AI-133 AC-03 & AC-07)", () => {
  it("preserves session headings, bold badges, and nested bullet hierarchy", () => {
    const md = [
      "### Session 1",
      "- **Concept/Lecture** (180 min · Self Learning · OS1)",
      "  - Tokenization: Revise tokenization and usecases",
      "  - Quantization: Core concept and Algorithms",
      "- **Test/Quiz**: Quiz (30 min · Offline · OS1)",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(ChatMarkdown, { content: md }));
    expect(html).toContain("<h3");
    expect(html).toContain("Session 1</h3>");
    expect(html).toMatch(/<strong[^>]*>Concept\/Lecture<\/strong>/);
    // Nested sub-bullets must be rendered inside a child <ul> within the parent <li>
    expect(html).toMatch(/<strong[^>]*>Concept\/Lecture<\/strong>[\s\S]*?<ul[^>]*>\s*<li[^>]*>Tokenization:/);
  });

  it("drops XSS payloads safely instead of executing raw HTML", () => {
    const xss = "### Session 1\n- <script>alert('xss')</script>\n  - <img src=x onerror=alert(1)>";
    const html = renderToStaticMarkup(React.createElement(ChatMarkdown, { content: xss }));
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).toContain("Session 1</h3>");
  });
});

