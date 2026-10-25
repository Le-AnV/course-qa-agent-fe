import { describe, expect, it } from "vitest";
import { buildActionItems } from "./action-items";

const cls = (over: Partial<{ id: string; code: string; name: string }> = {}) => ({
  id: "c1",
  code: "CS 401",
  name: "Intro to AI",
  ...over,
});

describe("buildActionItems", () => {
  it("lists a class with pending requests and links to Members", () => {
    const items = buildActionItems([cls()], { c1: 3 });

    expect(items).toEqual([
      {
        key: "requests:c1",
        classId: "c1",
        classCode: "CS 401",
        count: 3,
        href: "/teacher/class/c1/members",
        title: "3 join requests waiting",
        detail: "CS 401 · Intro to AI",
      },
    ]);
  });

  it("uses the singular for a single request", () => {
    expect(buildActionItems([cls()], { c1: 1 })[0].title).toBe("1 join request waiting");
  });

  it("skips classes with zero, unknown or missing counts", () => {
    const classes = [cls({ id: "a" }), cls({ id: "b" }), cls({ id: "c" })];

    expect(buildActionItems(classes, { a: 0, b: null })).toEqual([]);
    expect(buildActionItems(classes, { a: 0, b: null, c: undefined })).toEqual([]);
  });

  it("orders rows by class code", () => {
    const classes = [
      cls({ id: "z", code: "Z 900" }),
      cls({ id: "a", code: "A 100" }),
      cls({ id: "m", code: "M 500" }),
    ];

    expect(buildActionItems(classes, { z: 1, a: 2, m: 5 }).map((item) => item.classCode)).toEqual([
      "A 100",
      "M 500",
      "Z 900",
    ]);
  });
});
