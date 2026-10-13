import { describe, expect, it } from "vitest";
import { errorMessage, isSessionError } from "./api";

describe("isSessionError", () => {
  it("treats expired-token messages as session errors", () => {
    for (const message of [
      "Not authenticated.",
      "Invalid token.",
      "Role changed, please log in again.",
      "Request failed (401)",
    ]) {
      expect(isSessionError(new Error(message))).toBe(true);
    }
  });

  it("treats the generic login error as a session error outside the password dialog", () => {
    expect(isSessionError(new Error("Invalid email or password."))).toBe(true);
  });

  it("passes through validation and network failures", () => {
    expect(isSessionError(new Error("Display name must not be empty."))).toBe(false);
    expect(isSessionError(new Error("Unable to connect"))).toBe(false);
    expect(isSessionError(null)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("unwraps Error messages and falls back for unknown values", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage(null)).toBe("Request failed.");
    expect(errorMessage("plain string")).toBe("Request failed.");
  });
});
