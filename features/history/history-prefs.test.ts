import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readHistoryCollapsed, writeHistoryCollapsed } from "./history-prefs";

// The suite runs in the node environment (no jsdom), so stand in a minimal
// localStorage-backed window for the two functions under test.
const store = new Map<string, string>();
const fakeWindow = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  },
};

beforeEach(() => {
  store.clear();
  (globalThis as { window?: unknown }).window = fakeWindow;
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("history collapse preference", () => {
  it("defaults to expanded when nothing is stored", () => {
    expect(readHistoryCollapsed()).toBe(false);
  });

  it("round-trips both states", () => {
    writeHistoryCollapsed(true);
    expect(readHistoryCollapsed()).toBe(true);

    writeHistoryCollapsed(false);
    expect(readHistoryCollapsed()).toBe(false);
  });

  it("ignores unrelated storage values", () => {
    store.set("qa.chat.historyCollapsed", "yes");
    expect(readHistoryCollapsed()).toBe(false);
  });
});
