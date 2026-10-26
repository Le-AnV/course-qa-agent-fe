import { describe, expect, it } from "vitest";
import { railSessions } from "./session-rail";

const sessions = ["a", "b", "c", "d", "e"].map((id) => ({ id, title: `Chat ${id}` }));

describe("railSessions", () => {
  it("keeps the newest three when nothing is active", () => {
    expect(railSessions(sessions, null).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps the order untouched when the active chat is already visible", () => {
    expect(railSessions(sessions, "b").map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("swaps the oldest shortcut for the active conversation", () => {
    expect(railSessions(sessions, "e").map((s) => s.id)).toEqual(["a", "b", "e"]);
  });

  it("ignores an active id that is not in the list", () => {
    expect(railSessions(sessions, "missing").map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("returns everything when there are fewer than the limit", () => {
    expect(railSessions(sessions.slice(0, 2), null).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("returns nothing for a non-positive limit", () => {
    expect(railSessions(sessions, null, 0)).toEqual([]);
  });
});
