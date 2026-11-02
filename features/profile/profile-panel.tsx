"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, KeyRound, Loader2, Mail } from "lucide-react";
import { errorMessage, isSessionError, profileApi } from "./api";
import { PageContainer, PAGE_COLUMN } from "@/components/shared/PageShell";
import { useProfile } from "./profile-context";
import { PasswordDialog } from "./password-dialog";
import {
  initialsFor,
  isDisplayNameDirty,
  roleBadgeLabel,
  validateDisplayName,
} from "./validation";

/** Suspense fallback for `app/(shell)/account/page.tsx` — masthead + two cards. */
export function ProfileLoadingSkeleton() {
  return (
    <div className={PAGE_COLUMN} aria-busy="true">
      <div className="h-7 w-32 skeleton-shimmer rounded bg-[#EDEDED]" />
      <div className="mt-2 h-4 w-64 skeleton-shimmer rounded bg-[#EDEDED]" />
      <div className="mt-10 flex flex-col gap-6">
        <div className="h-[92px] skeleton-shimmer rounded-lg border border-[#DADADA] bg-white shadow-sm [--skeleton-sheen:rgba(17,17,17,0.05)]" />
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <div className="h-[232px] skeleton-shimmer rounded-lg border border-[#DADADA] bg-white shadow-sm [--skeleton-sheen:rgba(17,17,17,0.05)]" />
          <div className="h-[232px] skeleton-shimmer rounded-lg border border-[#DADADA] bg-white shadow-sm [--skeleton-sheen:rgba(17,17,17,0.05)]" />
        </div>
      </div>
    </div>
  );
}

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-lg border border-[#DADADA] bg-white px-3.5 py-2.5 text-[14px] text-[#111111] placeholder:text-[#6F6F6F] transition-colors focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 disabled:bg-[#FFFFFF]";

const LABEL_CLASSES = "block text-[12.5px] font-semibold text-[#111111]";
const CARD_CLASSES = "rounded-lg border border-[#DADADA] bg-white shadow-sm";
const ICON_ACTION_CLASSES =
  "inline-flex items-center gap-2 rounded-lg border border-[#DADADA] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#111111] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/40";

/**
 * Shared profile surface for every authenticated role (AI-29).
 * Identity column on the left, the rename task as the page's hero on the
 * right, security a deliberate step below — the product's own teal-and-slate
 * grammar, not a stock settings form.
 */
export function ProfilePanel({ signOut }: { signOut: () => void }) {
  const { profile, error, sessionExpired, setProfile, refresh } = useProfile();
  const [draft, setDraft] = React.useState(profile?.username ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  // Timestamp of the last successful rename. `justSaved` is DERIVED from it so
  // the render-phase profile sync below can never clear it by accident.
  const [lastSavedAt, setLastSavedAt] = React.useState(0);
  const nameRef = React.useRef<HTMLInputElement>(null);

  const expireSession = React.useCallback(() => {
    toast.error("Session expired. Log in again to continue.");
    signOut();
  }, [signOut]);

  // /me answered 401/403 — renew the session exactly like a failed save did.
  React.useEffect(() => {
    if (sessionExpired) expireSession();
  }, [sessionExpired, expireSession, profile]);

  // Derived state: re-seed the draft when the shared profile changes (load,
  // rename, refresh). React's documented adjust-during-render pattern.
  const [syncedProfile, setSyncedProfile] = React.useState(profile);
  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    setDraft(profile?.username ?? "");
  }

  // The one authored moment: the confirmation after a rename, then it rests.
  React.useEffect(() => {
    if (lastSavedAt === 0) return;
    const timer = window.setTimeout(() => setLastSavedAt(0), 2500);
    return () => window.clearTimeout(timer);
  }, [lastSavedAt]);

  const dirty = isDisplayNameDirty(draft, profile?.username ?? "");
  const justSaved = lastSavedAt !== 0 && !dirty;

  /** AC-03 — rename; the updated /me re-renders the header, no reload. */
  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    // Guard instead of disabling: a disabled control loses keyboard focus
    // mid-request (focus falls to <body>) and the user is thrown out of the form.
    if (saving) return;
    const invalid = validateDisplayName(draft);
    setNameError(invalid);
    if (invalid) {
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile(draft);
      setProfile(updated);
      setDraft(updated.username);
      setNameError(null);
      setLastSavedAt(Date.now());
      toast.success("Profile updated.");
    } catch (err) {
      if (isSessionError(err)) {
        expireSession();
        return;
      }
      setNameError(errorMessage(err));
      nameRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-[#ECD2CB] bg-[#FBF5F4] p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#9D4C38]">Profile unavailable</h2>
          <p className="mt-1 text-[13px] text-[#7F3D2D]">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#DADADA] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/40"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-[#111111]">
        Account
      </h1>
      <p className="mt-2 text-[14px] text-[#5A5A5A]">
        Your profile and the details you use to sign in.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {/* Identity masthead — real facts only, no filler prose. */}
        <section
          className={`${CARD_CLASSES} flex flex-wrap items-center gap-x-8 gap-y-4 p-6`}
          aria-label="Your identity"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[18px] font-semibold text-[#111111]">
            {initialsFor(profile.username)}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2
              className="truncate text-[18px] font-semibold text-[#111111]"
              title={profile.username}
            >
              {profile.username}
            </h2>
            <span className="inline-flex w-fit items-center rounded-full border border-[#CFCFCF] bg-[#F7F7F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
              {roleBadgeLabel(profile.role)}
            </span>
          </div>
          <dl className="ml-auto flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <dt className="sr-only">Email</dt>
              <Mail className="h-4 w-4 shrink-0 text-[#6F6F6F]" aria-hidden="true" />
              <dd className="truncate text-[13px] font-medium text-[#111111]" title={profile.email}>
                {profile.email}
              </dd>
            </div>
            {profile.student_code && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">Student ID</dt>
                <dd className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-bold tracking-wide text-[#111111]" title="Student ID (MSSV)">
                  {profile.student_code}
                </dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="sr-only">Status</dt>
              <dd className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3B7D5D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B7D5D]" aria-hidden="true" />
                {profile.is_active ? "Active" : "Inactive"}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          {/* (2) Rename — the reason people open this page. */}
          <section className={`${CARD_CLASSES} flex flex-col`}>
          <div className="px-6 pt-6">
            <h3 className="text-[15px] font-semibold text-[#111111]">Display name</h3>
            <p className="mt-1 text-[13px] text-[#5A5A5A]">
              Change how your name appears to everyone else.
            </p>
          </div>
          <form onSubmit={(event) => void saveName(event)} className="flex flex-1 flex-col" aria-busy={saving}>
            <div className="px-6 py-5">
              <label className={LABEL_CLASSES} htmlFor="profile-display-name">
                Name
              </label>
              <input
                id="profile-display-name"
                ref={nameRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby="profile-display-name-hint"
                autoComplete="name"
                className={`${FIELD_CLASSES} ${
                  nameError ? "border-[#DFB2A6] focus:border-[#C4644C] focus:ring-[#C4644C]/20" : ""
                }`}
              />
              {nameError ? (
                <p className="mt-2 text-[12.5px] text-[#C4644C]">{nameError}</p>
              ) : (
                <p id="profile-display-name-hint" className="mt-2 text-[12.5px] text-[#5A5A5A]">
                  Up to 100 characters.
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#DADADA] px-6 py-4">
              <p className="text-[12.5px] text-[#5A5A5A]" role="status" aria-live="polite">
                {dirty
                  ? "You have unsaved changes."
                  : justSaved
                    ? "All changes saved."
                    : "Nothing to save yet."}
              </p>
              <div className="flex items-center gap-3">
                {justSaved && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#3B7D5D]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Saved
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!dirty}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/40 ${
                    dirty
                      ? "border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7]"
                      : "cursor-not-allowed bg-[#F7F7F7] text-[#5A5A5A]"
                  }`}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* (3) Security — a deliberate step beside, never competing. */}
        <section className={`${CARD_CLASSES} flex flex-col p-6`}>
          <h3 className="text-[15px] font-semibold text-[#111111]">Password</h3>
          <p className="mt-1 text-[13px] text-[#5A5A5A]">
            Change the password you use to sign in.
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#5A5A5A]">
            Your email and role are managed by your administrator.
          </p>
          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className={ICON_ACTION_CLASSES}
            >
              <KeyRound className="h-4 w-4 text-[#6F6F6F]" aria-hidden="true" />
              Change password
            </button>
          </div>
        </section>
      </div>
      </div>

      <PasswordDialog
        key={passwordOpen ? "open" : "closed"}
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onSessionExpired={expireSession}
      />
    </PageContainer>
  );
}
