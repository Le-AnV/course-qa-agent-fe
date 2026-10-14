import { describe, expect, it } from "vitest";
import { settingsHrefForRole } from "./nav-config";

describe("settingsHrefForRole", () => {
  it("returns null for student (no student/settings route exists)", () => {
    expect(settingsHrefForRole("student")).toBeNull();
  });

  it("returns the teacher settings route for trainer roles", () => {
    expect(settingsHrefForRole("trainer")).toBe("/teacher/settings");
    expect(settingsHrefForRole("teaching_assistant")).toBe("/teacher/settings");
  });

  it("returns the admin settings route for admin", () => {
    expect(settingsHrefForRole("admin")).toBe("/admin/settings");
  });
});
