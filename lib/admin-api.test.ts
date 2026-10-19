import { describe, expect, it } from "vitest";
import { adminApi } from "./admin-api";

function mockFetch(calls: { url: string; init?: RequestInit }[], body: unknown, status = 200) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

describe("setClassCapacity (admin-owned roster capacity)", () => {
  it("PATCHes the class config with the new capacity", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, { class_id: "class-1", capacity: 40 });
    try {
      const result = await adminApi.setClassCapacity("class-1", 40);
      expect(result.capacity).toBe(40);
      expect(calls[0].url).toContain("/api/classes/class-1/config");
      expect(calls[0].init?.method).toBe("PATCH");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({ capacity: 40 });
    } finally {
      restore();
    }
  });

  it("sends null to clear the limit", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, { class_id: "class-1", capacity: null });
    try {
      const result = await adminApi.setClassCapacity("class-1", null);
      expect(result.capacity).toBeNull();
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({ capacity: null });
    } finally {
      restore();
    }
  });

  it("surfaces the backend error detail (capacity below the roster)", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, { detail: "Capacity cannot be lower than the current roster (12)." }, 400);
    try {
      await expect(adminApi.setClassCapacity("class-1", 5)).rejects.toThrow(
        "Capacity cannot be lower than the current roster (12).",
      );
    } finally {
      restore();
    }
  });
});
