import { redirect } from "next/navigation";

/**
 * Back-compat redirect (AI-29): the per-role mock at `/teacher/account` is
 * replaced by the shared surface at `/account` (spec §3). Kept so existing
 * sidebar links and bookmarks keep working — no duplicate UI here.
 */
export default function TeacherAccountRedirect() {
  redirect("/account");
}
