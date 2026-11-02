import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  clearChatSessionCache,
  readChatSession,
  writeChatSession,
} from "./chat-session-cache";

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const originalWindow = (globalThis as { window?: unknown }).window;
let local: MemoryStorage;
let session: MemoryStorage;

beforeEach(() => {
  local = new MemoryStorage();
  session = new MemoryStorage();
  local.setItem(AUTH_TOKEN_KEY, "token-aaaaaaaaaaaaaaaa");
  (globalThis as { window?: unknown }).window = {
    localStorage: local,
    sessionStorage: session,
  };
});

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
});

describe("chat session cache", () => {
  it("scopes the selected session by role and class", () => {
    writeChatSession("teacher", "class-1", "session-a");

    expect(readChatSession("teacher", "class-1")).toBe("session-a");
    expect(readChatSession("student", "class-1")).toBeNull();
    expect(readChatSession("teacher", "class-2")).toBeNull();
  });

  it("clears the selection when a new chat starts", () => {
    writeChatSession("teacher", "class-1", "session-a");
    writeChatSession("teacher", "class-1", null);

    expect(readChatSession("teacher", "class-1")).toBeNull();
  });

  it("does not restore a session after a new login", () => {
    writeChatSession("teacher", "class-1", "session-a");
    local.setItem(AUTH_TOKEN_KEY, "token-bbbbbbbbbbbbbbbb");

    expect(readChatSession("teacher", "class-1")).toBeNull();
  });

  it("clears chat sessions without touching class cache entries", () => {
    writeChatSession("teacher", "class-1", "session-a");
    session.setItem("qa.classes.keep", "value");

    clearChatSessionCache();

    expect(readChatSession("teacher", "class-1")).toBeNull();
    expect(session.getItem("qa.classes.keep")).toBe("value");
  });
});
