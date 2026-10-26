import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SuggestedQuestions } from "./suggested-questions";

describe("SuggestedQuestions", () => {
  it("renders null when questions array is empty", () => {
    const html = renderToStaticMarkup(
      React.createElement(SuggestedQuestions, {
        questions: [],
        onSelect: () => {},
      })
    );
    expect(html).toBe("");
  });

  it("renders skeleton items when isLoading is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(SuggestedQuestions, {
        questions: ["Question 1"],
        isLoading: true,
        onSelect: () => {},
      })
    );
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("Question 1");
  });

  it("renders questions with the correct css classes", () => {
    const questions = [
      "What units are covered in this course?",
      "Explain the A* search algorithm?",
      "What reading materials are required for unit 1?",
    ];
    const html = renderToStaticMarkup(
      React.createElement(SuggestedQuestions, {
        questions,
        onSelect: () => {},
      })
    );

    expect(html).toContain("rounded-full border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#5A5A5A]");
    expect(html).toContain("What units are covered in this course?");
    expect(html).toContain("Explain the A* search algorithm?");
    expect(html).toContain("What reading materials are required for unit 1?");
  });

  it("renders optional label when provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(SuggestedQuestions, {
        questions: ["Follow up question?"],
        label: "Suggested follow-ups:",
        onSelect: () => {},
      })
    );
    expect(html).toContain("Suggested follow-ups:");
    expect(html).toContain("Follow up question?");
  });

  it("sets disabled attribute on buttons when disabled is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(SuggestedQuestions, {
        questions: ["Question 1"],
        disabled: true,
        onSelect: () => {},
      })
    );
    expect(html).toContain("disabled=\"\"");
  });
});
