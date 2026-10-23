import { describe, expect, it } from "vitest";
import { isGeneratedCodeCurrent, updateAdminUserForm } from "./admin-user-form";

const base = {
  username: "Tran Van A",
  email: "a@example.com",
  role: "student",
  code: "TVA_1234",
};

describe("admin user form", () => {
  it("clears the code when the name changes", () => {
    const next = updateAdminUserForm(base, { username: "Nguyen Van B" });
    expect(next.username).toBe("Nguyen Van B");
    expect(next.code).toBe("");
  });

  it("clears the code when the role changes", () => {
    expect(updateAdminUserForm(base, { role: "trainer" }).code).toBe("");
  });

  it("keeps the code when unrelated fields change", () => {
    expect(updateAdminUserForm(base, { email: "b@example.com" }).code).toBe("TVA_1234");
    expect(updateAdminUserForm(base, { code: "TVA_9999" }).code).toBe("TVA_9999");
  });

  it("accepts a generated code only for the same name and role", () => {
    expect(isGeneratedCodeCurrent(base, { username: "  Tran Van A  ", role: "student" })).toBe(true);
    expect(isGeneratedCodeCurrent(base, { username: "Nguyen Van B", role: "student" })).toBe(false);
    expect(isGeneratedCodeCurrent(base, { username: "Tran Van A", role: "trainer" })).toBe(false);
  });
});
