import { describe, expect, it } from "vitest";
import { classSectionFromPathname } from "./class-route";

describe("classSectionFromPathname", () => {
  it("keeps the current tab inside a class workspace", () => {
    expect(classSectionFromPathname("/teacher/class/abc/agent", "/teacher")).toBe("agent");
    expect(classSectionFromPathname("/student/class/abc/proposals", "/student")).toBe(
      "proposals",
    );
  });

  it("falls back to overview outside a tab route", () => {
    expect(classSectionFromPathname("/teacher/class/abc", "/teacher")).toBe("overview");
    expect(classSectionFromPathname("/teacher/classes", "/teacher")).toBe("overview");
    expect(classSectionFromPathname("/student", "/student")).toBe("overview");
  });

  it("ignores a different role base path", () => {
    expect(classSectionFromPathname("/student/class/abc/agent", "/teacher")).toBe(
      "overview",
    );
  });
});
