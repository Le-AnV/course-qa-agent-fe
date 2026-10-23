export type AdminUserFormState = {
  username: string;
  email: string;
  role: string;
  code: string;
};

export function updateAdminUserForm(
  form: AdminUserFormState,
  patch: Partial<AdminUserFormState>,
): AdminUserFormState {
  const next = { ...form, ...patch };
  if (patch.username !== undefined || patch.role !== undefined) {
    next.code = "";
  }
  return next;
}

export function isGeneratedCodeCurrent(
  form: Pick<AdminUserFormState, "username" | "role">,
  requested: Pick<AdminUserFormState, "username" | "role">,
): boolean {
  return form.username.trim() === requested.username.trim() && form.role === requested.role;
}
