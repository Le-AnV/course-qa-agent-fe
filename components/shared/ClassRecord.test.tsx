import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClassInfoCard } from "./ClassInfoCard";
import { ClassRecord } from "./ClassRecord";
import type { ClassInfo, StudentClass } from "@/lib/student-api";

const cls: StudentClass = {
  id: "class-1",
  code: "CSE2010",
  name: "C/C++ Programming",
  trainer_name: "Nguyen Van A",
  credits: 3,
  semester: "Fall",
  academic_year: "2026",
  member_count: 42,
  document_count: 7,
  status: "active",
};

const info: ClassInfo = {
  class_id: "class-1",
  description: "**Build** small programs in C and C++.",
  meeting_url: "https://meet.example.com/class",
  group_url: "https://chat.example.com/class",
  schedule_note: "Week 1",
  note: "Bring a laptop.",
};

function render(component: React.ReactElement): string {
  return renderToStaticMarkup(component);
}

describe("ClassRecord", () => {
  it("keeps the remote class summary content", () => {
    const html = render(React.createElement(ClassRecord, { cls, role: "teacher" }));

    expect(html).not.toContain("Class Overview");
    expect(html).toContain("CSE2010");
    expect(html).toContain("C/C++ Programming");
    expect(html).toContain("Fall 2026");
    expect(html).toContain("Teacher");
    expect(html).toContain("Nguyen Van A");
    expect(html).toContain("Resources");
    expect(html).toContain("Members");
    expect(html).toContain("Credits");
    expect(html).toContain(">7</p>");
    expect(html).toContain(">42</p>");
    expect(html).toContain(">3</p>");
  });

  it("uses the student header from the remote page", () => {
    const html = render(React.createElement(ClassRecord, { cls, role: "student" }));

    expect(html).toContain("C/C++ Programming");
    expect(html).toContain("Fall 2026");
    expect(html).toContain("Trainer");
    expect(html).toContain("Nguyen Van A");
  });

  it("renders a stable skeleton when the class has not loaded", () => {
    const html = render(React.createElement(ClassRecord, { cls: null, role: "teacher" }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("skeleton-shimmer");
    expect(html).not.toContain("Class Overview");
  });

  it("falls back to an em dash for a missing trainer", () => {
    const html = render(
      React.createElement(ClassRecord, {
        cls: { ...cls, trainer_name: null },
        role: "teacher",
      }),
    );

    expect(html).toContain("Teacher");
    expect(html).toContain("\u2014");
  });
});

describe("ClassInfoCard", () => {
  it("keeps the remote labels and description content", () => {
    const html = render(React.createElement(ClassInfoCard, { info }));

    expect(html).toContain("Class information");
    expect(html).toContain("Schedule");
    expect(html).toContain("Online class");
    expect(html).toContain("Class group");
    expect(html).toContain("Description");
    expect(html).toContain("More information");
    expect(html).toContain(">Build</strong>");
  });
});
