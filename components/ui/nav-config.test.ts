import { describe, expect, it } from "vitest";
import { NAV_ITEMS, settingsHrefForRole } from "./nav-config";

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

describe("admin navigation (AI-109)", () => {
  it("exposes the System Health page to admins only", () => {
    const item = NAV_ITEMS.find((entry) => entry.href === "/admin/system");
    expect(item).toBeDefined();
    expect(item?.label).toBe("System Health");
    expect(item?.roles).toEqual(["admin"]);
  });
});
