"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronRight, FileText, MessageSquare, Plus, Sparkles } from "lucide-react";

import { ChatInput } from "@/features/chat/chat-input";
import { MessageBubble } from "@/features/chat/message-bubble";
import { CLASSES } from "@/lib/classes";

const previewCourses = CLASSES.slice(0, 2);
type PreviewChat = {
  id: string;
  title: string;
  time: string;
  question: string;
  answer: string;
};

const previewChats: Record<string, PreviewChat[]> = {
  "cs-401": [
    {
      id: "astar",
      title: "How A* search works",
      time: "2 min ago",
      question: "Can you explain how A* search chooses the next node?",
      answer: "A* selects the node with the lowest f(n) = g(n) + h(n), combining the path cost so far with the estimated cost to the goal.",
    },
    {
      id: "heuristics",
      title: "Choosing a heuristic",
      time: "Yesterday",
      question: "What makes a heuristic admissible?",
      answer: "An admissible heuristic never overestimates the true remaining cost, so A* can still guarantee an optimal solution.",
    },
    {
      id: "midterm",
      title: "Midterm review topics",
      time: "Oct 12",
      question: "Which search topics should I review for the midterm?",
      answer: "Review uninformed search, informed search, heuristic properties, and how path cost affects algorithm completeness and optimality.",
    },
  ],
  "se-301": [
    {
      id: "sprints",
      title: "Sprint planning basics",
      time: "8 min ago",
      question: "What should the team decide during sprint planning?",
      answer: "The team selects a sprint goal, chooses backlog items, and creates a realistic plan for delivering the selected work.",
    },
    {
      id: "testing",
      title: "Testing pyramid",
      time: "Monday",
      question: "Why should most tests be unit tests?",
      answer: "Unit tests are fast, focused, and inexpensive to run, while a smaller number of integration and end-to-end tests cover system boundaries.",
    },
    {
      id: "patterns",
      title: "Design pattern review",
      time: "Oct 10",
      question: "When is the Strategy pattern useful?",
      answer: "Use Strategy when several interchangeable algorithms share one purpose and the application needs to select one at runtime.",
    },
  ],
};

const previewSyllabus: Record<string, string[]> = {
  "cs-401": ["Informed search", "Heuristic design", "Adversarial search"],
  "se-301": ["Agile delivery", "Software testing", "Design patterns"],
};

export function ProductPreview() {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState(previewCourses[0].id);
  const [chatId, setChatId] = React.useState<string>(previewChats[previewCourses[0].id][0].id);

  const openLogin = () => router.push("/login");
  const activeCourse = previewCourses.find((course) => course.id === courseId) ?? previewCourses[0];
  const courseChats = previewChats[courseId];
  const activeChat = courseChats.find((chat) => chat.id === chatId) ?? courseChats[0];

  const selectCourse = (nextCourseId: string) => {
    setCourseId(nextCourseId);
    setChatId(previewChats[nextCourseId][0].id);
  };

  return (
    <figure className="relative mx-auto w-full max-w-6xl">
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-blue-100/60 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-950/[0.08]">
        <div className="flex h-12 items-center justify-between border-b border-blue-100 bg-white/90 px-4 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-slate-200" />
          </div>
          <span className="text-xs font-medium text-slate-500">Student workspace</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            Interactive preview
          </span>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <BookOpen className="size-3.5" aria-hidden="true" />
            Courses
          </div>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:pb-0">
            {previewCourses.map((course) => {
              const isActive = course.id === activeCourse.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => selectCourse(course.id)}
                  aria-pressed={isActive}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: course.accentColor }} />
                  <span className="text-[11px] font-semibold">{course.code}</span>
                  <span className="max-w-32 truncate text-[10px] text-slate-500">{course.title}</span>
                  {isActive && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-[500px] bg-slate-50 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)_180px]">
          <aside
            aria-label="Chat history preview"
            className="border-b border-slate-200 bg-white md:border-b-0 md:border-r"
          >
            <div className="p-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <MessageSquare className="size-3.5" aria-hidden="true" />
                  Chat history
                </div>
                <button
                  type="button"
                  onClick={() => setChatId(courseChats[0].id)}
                  aria-label="Start a new chat"
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 grid gap-1">
                {courseChats.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setChatId(session.id)}
                    aria-current={session.id === activeChat.id ? "true" : undefined}
                    className={`rounded-lg px-2 py-2 text-left transition-colors ${
                      session.id === activeChat.id ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="block truncate text-[11px] font-medium text-slate-700">{session.title}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{session.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex min-h-[500px] min-w-0 flex-col bg-white">
            <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: activeCourse.accentColor }}
                />
                <span className="truncate text-xs font-semibold text-slate-700">
                  {activeCourse.code} · {activeCourse.title}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">AI uses only this class&apos;s materials</p>
            </div>

            <div className="flex-1 p-4 sm:p-5">
              <MessageBubble
                role="user"
                content={activeChat.question}
              />
              <MessageBubble
                role="ai"
                content={activeChat.answer}
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                Answer scoped to {activeCourse.code} course materials
              </div>
            </div>

            <div className="border-t border-blue-100 bg-blue-50/70 px-4 py-2 text-center text-[11px] font-medium text-blue-700">
              <Sparkles className="mr-1 inline size-3.5" aria-hidden="true" />
              Type a question below. Sending it will take you to login.
            </div>
            <ChatInput onSend={openLogin} />
          </div>

          <aside
            aria-label="Syllabus focus preview"
            className="hidden border-l border-slate-200 bg-white p-3 xl:block"
          >
            <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <FileText className="size-3.5" aria-hidden="true" />
              Syllabus focus
            </div>
            <p className="mt-3 px-1 text-[10px] leading-4 text-slate-500">
              Topics used to keep answers relevant to {activeCourse.code}.
            </p>
            <div className="mt-3 grid gap-2">
              {previewSyllabus[courseId].map((topic, index) => (
                <div key={topic} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span className="block text-[10px] font-semibold text-blue-700">Module {index + 1}</span>
                  <span className="mt-1 block text-[11px] font-medium leading-4 text-slate-700">{topic}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
      <figcaption className="sr-only">
        Interactive preview of the real course chat interface. Entering a question and sending it opens the login page.
      </figcaption>
    </figure>
  );
}
