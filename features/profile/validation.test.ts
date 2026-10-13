import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX,
  GENERIC_AUTH_ERROR,
  NEW_PASSWORD_MIN,
  initialsFor,
  isAuthFailureMessage,
  isDisplayNameDirty,
  roleBadgeLabel,
  validateDisplayName,
  validateNewPassword,
  validatePasswordConfirm,
} from "./validation";

describe("validateDisplayName", () => {
  it("accepts a normal name", () => {
    expect(validateDisplayName("Nguyen Van A")).toBeNull();
  });

  it("rejects empty and whitespace-only names (BE 422)", () => {
    expect(validateDisplayName("")).toBe("Display name must not be empty.");
    expect(validateDisplayName("   ")).toBe("Display name must not be empty.");
  });

  it(`rejects names over ${DISPLAY_NAME_MAX} chars (BE 422)`, () => {
    expect(validateDisplayName("a".repeat(101))).toBe(
      "Display name must be at most 100 characters.",
    );
    expect(validateDisplayName("a".repeat(100))).toBeNull();
  });

  it("trims before measuring", () => {
    expect(validateDisplayName("  An  ")).toBeNull();
  });
});

describe("isDisplayNameDirty", () => {
  it("is false when the draft matches the saved name exactly", () => {
    expect(isDisplayNameDirty("Academic Trainer", "Academic Trainer")).toBe(false);
  });

  it("ignores surrounding whitespace so a re-save is a no-op", () => {
    expect(isDisplayNameDirty("  Academic Trainer  ", "Academic Trainer")).toBe(false);
  });

  it("is true once the trimmed draft differs from the saved name", () => {
    expect(isDisplayNameDirty("Academic Trainer 2", "Academic Trainer")).toBe(true);
    expect(isDisplayNameDirty("  Academic  ", "Academic Trainer")).toBe(true);
  });
});

describe("validateNewPassword", () => {
  it("accepts a strong, different password", () => {
    expect(validateNewPassword("Oldpass123", "Newpass456")).toBeNull();
  });

  it("requires a value", () => {
    expect(validateNewPassword("Oldpass123", "")).toBe("New password is required.");
  });

  it(`enforces min length ${NEW_PASSWORD_MIN} (BE 422)`, () => {
    expect(validateNewPassword("Oldpass123", "short")).toBe(
      "New password must be at least 8 characters.",
    );
  });

  it("rejects reusing the old password (BE 422)", () => {
    expect(validateNewPassword("Samepass1", "Samepass1")).toBe(
      "New password must differ from the old password.",
    );
  });
});

describe("validatePasswordConfirm", () => {
  it("accepts a matching confirmation", () => {
    expect(validatePasswordConfirm("Newpass456", "Newpass456")).toBeNull();
  });

  it("requires and matches the confirmation", () => {
    expect(validatePasswordConfirm("Newpass456", "")).toBe(
      "Please confirm the new password.",
    );
    expect(validatePasswordConfirm("Newpass456", "Otherpass1")).toBe(
      "Passwords do not match.",
    );
  });
});

describe("initialsFor", () => {
  it("takes first letters of the first two words", () => {
    expect(initialsFor("System Administrator")).toBe("SA");
    expect(initialsFor("Nguyen Van A")).toBe("NV");
  });

  it("handles single-word and empty names", () => {
    expect(initialsFor("Minh")).toBe("MI");
    expect(initialsFor("  ")).toBe("?");
    expect(initialsFor("")).toBe("?");
  });
});

describe("roleBadgeLabel", () => {
  it("maps backend roles to badge text (spec §3)", () => {
    expect(roleBadgeLabel("student")).toBe("Student");
    expect(roleBadgeLabel("trainer")).toBe("Trainer");
    expect(roleBadgeLabel("teaching_assistant")).toBe("Assistant");
    expect(roleBadgeLabel("admin")).toBe("Admin");
  });

  it("passes unknown roles through", () => {
    expect(roleBadgeLabel("auditor")).toBe("auditor");
  });
});

describe("isAuthFailureMessage", () => {
  it("matches expired-session messages", () => {
    for (const message of [
      "Not authenticated.",
      "Invalid token.",
      "Role changed, please log in again.",
      "Request failed (401)",
    ]) {
      expect(isAuthFailureMessage(message)).toBe(true);
    }
  });

  it("matches the generic login error", () => {
    expect(isAuthFailureMessage(GENERIC_AUTH_ERROR)).toBe(true);
  });

  it("ignores validation and network failures", () => {
    expect(isAuthFailureMessage("Display name must not be empty.")).toBe(false);
    expect(isAuthFailureMessage("Request failed (500)")).toBe(false);
    expect(isAuthFailureMessage("")).toBe(false);
  });
});
