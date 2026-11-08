import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  attendanceApi,
  attendanceFetch,
  responseError,
  type AttendanceRecordUpdate,
  type CreateScheduleBody,
  type CreateSessionBody,
} from "./attendance-api";

class MemoryStorage {
  private values = new Map<string, string>();

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function setupMockFetch(body: unknown, status = 200) {
  const calls: FetchCall[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const restore = () => {
    globalThis.fetch = originalFetch;
  };

  return { calls, restore };
}

const originalWindow = (globalThis as { window?: unknown }).window;
let local: MemoryStorage;

describe("attendance-api fetch helper & error handling", () => {
  beforeEach(() => {
    local = new MemoryStorage();
    (globalThis as { window?: unknown }).window = {
      localStorage: local,
    };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = originalWindow;
  });

  it("includes Authorization header when token is present in localStorage", async () => {
    local.setItem(AUTH_TOKEN_KEY, "test-jwt-token-123");
    const { calls, restore } = setupMockFetch({ ok: true });

    try {
      await attendanceFetch<{ ok: boolean }>("/api/test");
      expect(calls).toHaveLength(1);
      const headers = calls[0].init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-jwt-token-123");
      expect(headers["Content-Type"]).toBe("application/json");
    } finally {
      restore();
    }
  });

  it("omits Authorization header when no token is stored", async () => {
    const { calls, restore } = setupMockFetch({ ok: true });

    try {
      await attendanceFetch<{ ok: boolean }>("/api/test");
      expect(calls).toHaveLength(1);
      const headers = calls[0].init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
      expect(headers["Content-Type"]).toBe("application/json");
    } finally {
      restore();
    }
  });

  it("surfaces backend error detail string on HTTP failure", async () => {
    const { restore } = setupMockFetch(
      { detail: "Cannot schedule session on a holiday: 2026-11-20" },
      409,
    );

    try {
      await expect(attendanceFetch("/api/fail")).rejects.toThrow(
        "Cannot schedule session on a holiday: 2026-11-20",
      );
    } finally {
      restore();
    }
  });

  it("preserves detail property on error object", async () => {
    const response = new Response(
      JSON.stringify({ detail: "Attendance can only be recorded for today or past sessions." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

    const err = await responseError(response);
    expect(err.message).toBe("Attendance can only be recorded for today or past sessions.");
    expect(err.detail).toBe("Attendance can only be recorded for today or past sessions.");
  });

  it("handles object/validation detail properly", async () => {
    const validationDetails = [{ loc: ["records", 0], msg: "Invalid status" }];
    const response = new Response(JSON.stringify({ detail: validationDetails }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });

    const err = await responseError(response);
    expect(err.message).toBe(JSON.stringify(validationDetails));
    expect(err.detail).toEqual(validationDetails);
  });

  it("falls back to status code message when detail is missing", async () => {
    const response = new Response("{}", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });

    const err = await responseError(response);
    expect(err.message).toBe("Request failed with status 500");
    expect(err.detail).toBeUndefined();
  });
});

describe("attendanceApi endpoints & URL encoding", () => {
  beforeEach(() => {
    local = new MemoryStorage();
    (globalThis as { window?: unknown }).window = {
      localStorage: local,
    };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = originalWindow;
  });

  it("listSchedules calls GET with encoded classId", async () => {
    const mockSchedules = [
      {
        id: "sch-1",
        class_id: "class/123",
        subject: "CS101",
        weekday: 0,
        start_time: "09:00:00",
        end_time: "11:00:00",
        trainer_id: "tr-1",
        trainer_name: "Teacher",
        effective_from: "2026-09-01",
        effective_to: null,
      },
    ];
    const { calls, restore } = setupMockFetch(mockSchedules);

    try {
      const res = await attendanceApi.listSchedules("class/123");
      expect(calls[0].url).toContain("/api/classes/class%2F123/schedules");
      expect(calls[0].init?.method).toBeUndefined();
      expect(res).toEqual(mockSchedules);
    } finally {
      restore();
    }
  });

  it("createSchedule calls POST with payload", async () => {
    const payload: CreateScheduleBody = {
      weekday: 2,
      start_time: "14:00",
      end_time: "16:00",
      effective_from: "2026-09-01",
    };
    const { calls, restore } = setupMockFetch({ id: "sch-new" });

    try {
      await attendanceApi.createSchedule("c-1", payload);
      expect(calls[0].url).toContain("/api/classes/c-1/schedules");
      expect(calls[0].init?.method).toBe("POST");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual(payload);
    } finally {
      restore();
    }
  });

  it("deleteSchedule calls DELETE with encoded IDs", async () => {
    const { calls, restore } = setupMockFetch({ ok: true });

    try {
      const res = await attendanceApi.deleteSchedule("class/1", "sch/99");
      expect(calls[0].url).toContain("/api/classes/class%2F1/schedules/sch%2F99");
      expect(calls[0].init?.method).toBe("DELETE");
      expect(res).toEqual({ ok: true });
    } finally {
      restore();
    }
  });

  it("listSessions builds query params for from and to", async () => {
    const { calls, restore } = setupMockFetch([]);

    try {
      await attendanceApi.listSessions("c-1", "2026-11-01", "2026-11-07");
      expect(calls[0].url).toContain("/api/classes/c-1/sessions?from=2026-11-01&to=2026-11-07");
    } finally {
      restore();
    }
  });

  it("createSession calls POST with ad-hoc session payload", async () => {
    const payload: CreateSessionBody = {
      date: "2026-11-04",
      start_time: "18:00",
      end_time: "20:00",
      note: "Makeup session",
    };
    const { calls, restore } = setupMockFetch({ id: "sess-1", date: "2026-11-04" });

    try {
      await attendanceApi.createSession("c-1", payload);
      expect(calls[0].url).toContain("/api/classes/c-1/sessions");
      expect(calls[0].init?.method).toBe("POST");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual(payload);
    } finally {
      restore();
    }
  });

  it("getSheet calls GET for a specific session attendance", async () => {
    const { calls, restore } = setupMockFetch({
      session: { id: "sess/abc" },
      summary: { present: 0 },
      records: [],
    });

    try {
      await attendanceApi.getSheet("c-1", "sess/abc");
      expect(calls[0].url).toContain("/api/classes/c-1/sessions/sess%2Fabc/attendance");
    } finally {
      restore();
    }
  });

  it("saveSheet calls PUT with records wrapped in object", async () => {
    const records: AttendanceRecordUpdate[] = [
      { student_id: "stu-1", status: "present", note: "On time" },
      { student_id: "stu-2", status: "late", note: "10 mins" },
    ];
    const { calls, restore } = setupMockFetch({
      session: { id: "s-1" },
      summary: { present: 1, late: 1 },
      records: [],
    });

    try {
      await attendanceApi.saveSheet("c-1", "s-1", records);
      expect(calls[0].url).toContain("/api/classes/c-1/sessions/s-1/attendance");
      expect(calls[0].init?.method).toBe("PUT");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual({ records });
    } finally {
      restore();
    }
  });

  it("summary calls GET with query parameters", async () => {
    const { calls, restore } = setupMockFetch({
      class_id: "c-1",
      total_sessions: 5,
      students: [],
    });

    try {
      await attendanceApi.summary("c-1", "2026-09-01", "2026-11-06");
      expect(calls[0].url).toContain(
        "/api/classes/c-1/attendance/summary?from=2026-09-01&to=2026-11-06",
      );
    } finally {
      restore();
    }
  });

  it("myAttendance calls GET on student router with query parameters", async () => {
    const { calls, restore } = setupMockFetch({
      class_id: "c-1",
      total_sessions: 5,
      attended: 4,
      attendance_rate: 0.8,
      items: [],
    });

    try {
      await attendanceApi.myAttendance("class/99", "2026-09-01", "2026-11-06");
      expect(calls[0].url).toContain(
        "/api/student/classes/class%2F99/attendance?from=2026-09-01&to=2026-11-06",
      );
    } finally {
      restore();
    }
  });
});
