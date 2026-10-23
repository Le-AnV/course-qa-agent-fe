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

describe("generateUserCode", () => {
  it("POSTs the full name and role, then returns the generated code", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, { code: "TVA_4821" });
    try {
      const result = await adminApi.generateUserCode("Tran Van A", "student");
      expect(result.code).toBe("TVA_4821");
      expect(calls[0].url).toContain("/api/admin/users/generate-code");
      expect(calls[0].init?.method).toBe("POST");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({
        full_name: "Tran Van A",
        role: "student",
      });
    } finally {
      restore();
    }
  });
});

describe("retrievalConfig (AI-65 KB vs Internet threshold)", () => {
  it("reads the active threshold and the documented default", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, {
      threshold: 0.8,
      default_threshold: 0.8,
      is_default: true,
      updated_at: null,
    });
    try {
      const result = await adminApi.retrievalConfig();
      expect(result.threshold).toBe(0.8);
      expect(result.default_threshold).toBe(0.8);
      expect(calls[0].url).toContain("/api/admin/retrieval-config");
      expect(calls[0].init?.method).toBeUndefined();
    } finally {
      restore();
    }
  });

  it("PATCHes a new threshold that applies to the next question", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, {
      threshold: 0.65,
      default_threshold: 0.8,
      is_default: false,
      updated_at: "2026-10-20T10:00:00Z",
    });
    try {
      const result = await adminApi.updateRetrievalConfig(0.65);
      expect(result.threshold).toBe(0.65);
      expect(result.is_default).toBe(false);
      expect(calls[0].url).toContain("/api/admin/retrieval-config");
      expect(calls[0].init?.method).toBe("PATCH");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({ threshold: 0.65 });
    } finally {
      restore();
    }
  });

  it("surfaces backend validation errors", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const restore = mockFetch(calls, { detail: "Threshold must be a number between 0 and 1." }, 400);
    try {
      await expect(adminApi.updateRetrievalConfig(1.5)).rejects.toThrow(
        "Threshold must be a number between 0 and 1.",
      );
    } finally {
      restore();
    }
  });
});
