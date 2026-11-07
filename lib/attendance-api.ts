/**
 * Attendance API Client & Types (AI-136).
 * Maps 1-1 to Backend Attendance Pydantic Schemas.
 */

import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AttendanceStatus =
  | "present"
  | "late"
  | "excused_absence"
  | "unexcused_absence";

export type SessionStatus = "scheduled" | "cancelled" | "rescheduled";

export type ClassSchedule = {
  id: string;
  class_id: string;
  subject: string;
  weekday: number; // 0=Monday ... 6=Sunday
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string;
  trainer_id: string;
  trainer_name: string | null;
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null;
};

export type CreateScheduleBody = {
  weekday: number;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to?: string | null;
  trainer_id?: string | null;
};

export type ClassSession = {
  id: string;
  class_id: string;
  schedule_id: string | null;
  date: string; // YYYY-MM-DD
  start_at: string; // ISO datetime
  end_at: string; // ISO datetime
  trainer_id: string;
  trainer_name: string | null;
  status: SessionStatus;
  note: string | null;
  student_count: number;
  marked_count: number;
};

export type CreateSessionBody = {
  date: string;
  start_time: string;
  end_time: string;
  trainer_id?: string | null;
  note?: string | null;
};

export type AttendanceRecord = {
  student_id: string;
  student_code: string | null;
  full_name: string;
  email: string;
  status: AttendanceStatus | null;
  note: string | null;
  updated_at: string | null;
};

export type AttendanceRecordUpdate = {
  student_id: string;
  status: AttendanceStatus;
  note?: string | null;
};

export type AttendanceCounts = {
  present: number;
  late: number;
  excused_absence: number;
  unexcused_absence: number;
  unmarked: number;
};

export type AttendanceSheet = {
  session: ClassSession;
  summary: AttendanceCounts;
  records: AttendanceRecord[];
};

export type AttendanceSummaryRow = {
  student_id: string;
  student_code: string | null;
  full_name: string;
  present: number;
  late: number;
  excused_absence: number;
  unexcused_absence: number;
  unmarked: number;
  attendance_rate: number | null;
};

export type AttendanceSummary = {
  class_id: string;
  date_from: string;
  date_to: string;
  total_sessions: number;
  students: AttendanceSummaryRow[];
};

export type StudentAttendanceItem = {
  session_id: string;
  date: string;
  start_at: string;
  end_at: string;
  session_status: SessionStatus;
  status: AttendanceStatus | null;
  note: string | null;
  updated_at: string | null;
};

export type StudentAttendance = {
  class_id: string;
  date_from: string;
  date_to: string;
  total_sessions: number;
  attended: number;
  attendance_rate: number | null;
  items: StudentAttendanceItem[];
};

function token(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function responseError(response: Response): Promise<Error & { detail?: unknown }> {
  const body = await response.json().catch(() => ({}));
  const detail = (body as { detail?: unknown }).detail;
  const message =
    typeof detail === "string"
      ? detail
      : typeof detail === "object" && detail !== null
        ? JSON.stringify(detail)
        : `Request failed with status ${response.status}`;
  const error = new Error(message) as Error & { detail?: unknown };
  error.detail = detail;
  return error;
}

export async function attendanceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authToken = token();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await responseError(response);
  }

  return (await response.json()) as T;
}

function buildQuery(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const attendanceApi = {
  listSchedules: (classId: string): Promise<ClassSchedule[]> =>
    attendanceFetch<ClassSchedule[]>(
      `/api/classes/${encodeURIComponent(classId)}/schedules`,
    ),

  createSchedule: (
    classId: string,
    body: CreateScheduleBody,
  ): Promise<ClassSchedule> =>
    attendanceFetch<ClassSchedule>(
      `/api/classes/${encodeURIComponent(classId)}/schedules`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  deleteSchedule: (
    classId: string,
    scheduleId: string,
  ): Promise<{ ok: boolean }> =>
    attendanceFetch<{ ok: boolean }>(
      `/api/classes/${encodeURIComponent(classId)}/schedules/${encodeURIComponent(scheduleId)}`,
      {
        method: "DELETE",
      },
    ),

  listSessions: (
    classId: string,
    from?: string,
    to?: string,
  ): Promise<ClassSession[]> =>
    attendanceFetch<ClassSession[]>(
      `/api/classes/${encodeURIComponent(classId)}/sessions${buildQuery(from, to)}`,
    ),

  createSession: (
    classId: string,
    body: CreateSessionBody,
  ): Promise<ClassSession> =>
    attendanceFetch<ClassSession>(
      `/api/classes/${encodeURIComponent(classId)}/sessions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  getSheet: (classId: string, sessionId: string): Promise<AttendanceSheet> =>
    attendanceFetch<AttendanceSheet>(
      `/api/classes/${encodeURIComponent(classId)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
    ),

  saveSheet: (
    classId: string,
    sessionId: string,
    records: AttendanceRecordUpdate[],
  ): Promise<AttendanceSheet> =>
    attendanceFetch<AttendanceSheet>(
      `/api/classes/${encodeURIComponent(classId)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
      {
        method: "PUT",
        body: JSON.stringify({ records }),
      },
    ),

  summary: (
    classId: string,
    from?: string,
    to?: string,
  ): Promise<AttendanceSummary> =>
    attendanceFetch<AttendanceSummary>(
      `/api/classes/${encodeURIComponent(classId)}/attendance/summary${buildQuery(from, to)}`,
    ),

  myAttendance: (
    classId: string,
    from?: string,
    to?: string,
  ): Promise<StudentAttendance> =>
    attendanceFetch<StudentAttendance>(
      `/api/student/classes/${encodeURIComponent(classId)}/attendance${buildQuery(from, to)}`,
    ),
};



