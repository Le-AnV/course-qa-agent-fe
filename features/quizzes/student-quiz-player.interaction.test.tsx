// @vitest-environment jsdom
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentQuizPlayer } from "./student-quiz-player";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ui/dialog", () => {
  const Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return {
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div role="dialog">{children}</div> : null,
    DialogContent: Container,
    DialogDescription: Container,
    DialogFooter: Container,
    DialogHeader: Container,
    DialogTitle: Container,
  };
});

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

const NOW = "2026-11-07T03:00:00Z";
const DEADLINE = "2026-11-07T03:30:00Z";

const questions = [
  {
    id: "q1",
    question_type: "SINGLE_CHOICE" as const,
    question: "Which layer routes packets?",
    points: 1,
    difficulty: "APPLY" as const,
    order_index: 0,
    options: [
      { id: "q1a", option_label: "A", option_text: "Network", order_index: 0 },
      { id: "q1b", option_label: "B", option_text: "Physical", order_index: 1 },
    ],
  },
  {
    id: "q2",
    question_type: "SINGLE_CHOICE" as const,
    question: "Which protocol is connection oriented?",
    points: 1,
    difficulty: "UNDERSTAND" as const,
    order_index: 1,
    options: [
      { id: "q2a", option_label: "A", option_text: "TCP", order_index: 0 },
      { id: "q2b", option_label: "B", option_text: "IP", order_index: 1 },
    ],
  },
  {
    id: "q3",
    question_type: "FILL_IN_BLANK" as const,
    question: "TLS runs on top of ____.",
    points: 1,
    difficulty: "REMEMBER" as const,
    order_index: 2,
    options: [],
  },
];

const session = {
  attempt_id: "a1",
  quiz_id: "q1",
  quiz_title: "Timed quiz",
  quiz_description: "Midterm",
  time_limit_minutes: 30,
  status: "IN_PROGRESS" as const,
  started_at: NOW,
  deadline_at: DEADLINE,
  server_time: NOW,
  remaining_seconds: 1800,
  questions,
  answers: [
    {
      id: "ans1",
      attempt_id: "a1",
      question_id: "q1",
      selected_option_labels: ["A"],
      text_answer: null,
      is_marked_for_review: false,
      score_awarded: null,
      breakdown: null,
    },
  ],
  total_points: 3,
  answered_count: 1,
  result: null,
};

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("student quiz player", () => {
  let host: HTMLDivElement;
  let root: Root;
  const saveRequests: { answers: { question_id: string; selected_option_labels: string[] | null }[] }[] = [];
  let submitCount = 0;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    saveRequests.length = 0;
    submitCount = 0;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const path = String(url);
      const method = init?.method ?? "GET";
      if (path.endsWith("/answers") && method === "PATCH") {
        saveRequests.push(JSON.parse(String(init?.body)));
        return json(session);
      }
      if (path.endsWith("/submit") && method === "POST") {
        submitCount += 1;
        return json({
          ...session,
          status: "SUBMITTED",
          questions: [],
          answered_count: 2,
          result: {
            attempt_id: "a1",
            quiz_id: "q1",
            quiz_title: "Timed quiz",
            status: "SUBMITTED",
            started_at: NOW,
            submitted_at: NOW,
            total_score: 2,
            max_score: 3,
            percentage: 66.67,
            passing_score: 60,
            is_passed: true,
            questions: [
              {
                ...questions[0],
                explanation: "The network layer routes packets.",
                rubric: null,
                source_reference: null,
                options: [
                  { ...questions[0].options[0], is_correct: true },
                  { ...questions[0].options[1], is_correct: false },
                ],
              },
            ],
            answers: session.answers,
          },
        });
      }
      return json(session);
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
  });

  function optionInput(text: string): HTMLInputElement {
    const label = Array.from(host.querySelectorAll("label")).find((item) =>
      item.textContent?.includes(text),
    );
    const input = label?.querySelector("input");
    if (!input) throw new Error(`Option not found: ${text}`);
    return input as HTMLInputElement;
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(host.querySelectorAll("button")).find(
      (item) => item.textContent?.trim() === label,
    );
    if (!found) throw new Error(`Button not found: ${label}`);
    return found;
  }

  it("restores a draft, autosaves a new answer and submits once", async () => {
    await act(async () => root.render(<StudentQuizPlayer classId="c1" quizId="q1" />));

    // AC-03: the saved draft is restored after a reload.
    expect(optionInput("Network").checked).toBe(true);
    expect(host.textContent).toContain("1/3 answered");

    await act(async () => button("2").click());
    await act(async () => optionInput("TCP").click());
    expect(host.textContent).toContain("2/3 answered");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 900));
    });
    expect(saveRequests).toHaveLength(1);
    expect(saveRequests[0].answers).toContainEqual(
      expect.objectContaining({ question_id: "q2", selected_option_labels: ["A"] }),
    );

    // AC-04: the confirmation warns about the remaining unanswered question.
    await act(async () => button("Submit quiz").click());
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain(
      "1 question still have no answer",
    );

    // AC-06: a double click still sends one submit request.
    await act(async () => {
      button("Submit anyway").click();
      button("Submit anyway").click();
    });
    expect(submitCount).toBe(1);
    expect(host.textContent).toContain("Submitted.");
    expect(host.textContent).toContain("Passed");
  });
});
