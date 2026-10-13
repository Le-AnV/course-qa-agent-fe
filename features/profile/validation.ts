/**
 * AI-29 profile validation helpers (pure — covered by vitest).
 * Mirrors the BE rules in `app/services/auth_service.py`
 * (`update_profile` / `change_password`).
 */

/** BE `ProfileUpdateRequest.full_name`: 1–100 chars after trimming. */
export const DISPLAY_NAME_MAX = 100;

/** BE `ChangePasswordRequest.new_password`: min 8 chars. */
export const NEW_PASSWORD_MIN = 8;

/** BE `LOGIN_GENERIC_ERROR` — also returned for a wrong old password. */
export const GENERIC_AUTH_ERROR = "Invalid email or password.";

/** Session failures raised by `get_current_user` (BE `app/core/deps.py`). */
const SESSION_EXPIRED_MESSAGES = new Set([
  "Not authenticated.",
  "Invalid token.",
  "Role changed, please log in again.",
]);

export function validateDisplayName(raw: string): string | null {
  const name = (raw ?? "").trim();
  if (!name) return "Display name must not be empty.";
  if (name.length > DISPLAY_NAME_MAX)
    return "Display name must be at most 100 characters.";
  return null;
}

/** True when saving would actually change the stored display name. */
export function isDisplayNameDirty(raw: string, saved: string): boolean {
  return (raw ?? "").trim() !== (saved ?? "").trim();
}

export function validateNewPassword(oldPassword: string, next: string): string | null {
  if (!next) return "New password is required.";
  if (next.length < NEW_PASSWORD_MIN)
    return "New password must be at least 8 characters.";
  if (next === oldPassword)
    return "New password must differ from the old password.";
  return null;
}

export function validatePasswordConfirm(next: string, confirm: string): string | null {
  if (!confirm) return "Please confirm the new password.";
  if (confirm !== next) return "Passwords do not match.";
  return null;
}

/** Monogram for the header avatar — "System Administrator" -> "SA". */
export function initialsFor(displayName: string): string {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  trainer: "Trainer",
  teaching_assistant: "Assistant",
  admin: "Admin",
};

/** Display-only role badge text (spec §3) — unknown roles pass through. */
export function roleBadgeLabel(role: string): string {
  return ROLE_LABELS[(role ?? "").toLowerCase()] ?? role;
}

/**
 * True when an `apiFetch()` failure message means the session is no longer
 * valid. `apiFetch()` drops the HTTP status, so this matches the known auth
 * messages plus the `(401)` suffix it appends when there is no detail body.
 *
 * NOTE: the generic login message is ambiguous — in the change-password
 * dialog the BE uses it for a wrong old password, so the dialog checks for
 * it first (in-dialog banner) and only treats other auth failures as
 * session expiry. Everywhere else it means "re-login".
 */
export function isAuthFailureMessage(message: string): boolean {
  if (!message) return false;
  if (message === GENERIC_AUTH_ERROR) return true;
  if (SESSION_EXPIRED_MESSAGES.has(message)) return true;
  return /\(401\)/.test(message);
}
