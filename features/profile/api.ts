/**
 * AI-29 profile API client (AC-01 view, AC-03 rename, AC-02 change password).
 * Built on `apiFetch()` from `lib/admin-api.ts` — same base URL
 * (`NEXT_PUBLIC_API_URL`) and Bearer auth (`localStorage qa.auth.token`).
 */
import { apiFetch } from "@/lib/admin-api";
import { isAuthFailureMessage } from "./validation";

/** Mirrors BE `MeResponse` — `username` is the `user.full_name` compat name. */
export type MeProfile = {
  id: string;
  username: string;
  email: string;
  role: string;
  class_id: string | null;
  is_active: boolean;
};

export type MessageResult = {
  message: string;
};

export function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Request failed.";
}

/** True when the call failed because the session is no longer valid. */
export function isSessionError(err: unknown): boolean {
  return isAuthFailureMessage(errorMessage(err));
}

export const profileApi = {
  /** AC-01 — view the caller's own profile. */
  me: () => apiFetch<MeProfile>("/api/auth/me"),

  /** AC-03 — rename the caller's own display name; returns updated /me. */
  updateProfile: (fullName: string) =>
    apiFetch<MeProfile>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: fullName.trim() }),
    }),

  /** AC-02 — verify old password, store the new one hashed. */
  changePassword: (oldPassword: string, newPassword: string) =>
    apiFetch<MessageResult>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),
};
