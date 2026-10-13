"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GENERIC_AUTH_ERROR, validateNewPassword, validatePasswordConfirm } from "./validation";
import { errorMessage, isSessionError, profileApi } from "./api";

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder:text-[#94A3B8] transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F8FAFC]";

const LABEL_CLASSES = "block text-[12.5px] font-semibold text-[#334155]";

type PasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionExpired: () => void;
};

/**
 * Change-password dialog (AC-02, spec §4.3). Client validation mirrors the BE
 * before any request: new ≥ 8 chars, new ≠ old, confirm === new. A wrong old
 * password shows the generic login banner — never reveals "close". On other
 * auth failures the parent signs the user out. The parent remounts the dialog
 * per open (see `key` in profile-panel), so fields start empty every time.
 */
export function PasswordDialog({ open, onOpenChange, onSessionExpired }: PasswordDialogProps) {
  const [oldPassword, setOldPassword] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [oldError, setOldError] = React.useState<string | null>(null);
  const [nextError, setNextError] = React.useState<string | null>(null);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [banner, setBanner] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const oldRef = React.useRef<HTMLInputElement>(null);
  const nextRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const nextInvalid = validateNewPassword(oldPassword, next);
    const confirmInvalid = validatePasswordConfirm(next, confirm);
    setOldError(oldPassword ? null : "Old password is required.");
    setNextError(nextInvalid);
    setConfirmError(confirmInvalid);
    return !oldPassword || nextInvalid || confirmInvalid ? false : true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBanner(null);
    // Guard instead of disabling so focus never falls to <body> mid-request.
    if (saving) return;
    if (!validate()) {
      // Send focus to the first field that needs attention.
      if (!oldPassword) oldRef.current?.focus();
      else if (validateNewPassword(oldPassword, next)) nextRef.current?.focus();
      else confirmRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await profileApi.changePassword(oldPassword, next);
      toast.success("Password changed successfully.");
      onOpenChange(false);
    } catch (err) {
      const message = errorMessage(err);
      if (message === GENERIC_AUTH_ERROR) {
        // Wrong old password by design — generic banner, keep fields (spec §5).
        setOldPassword("");
        setOldError(null);
        setBanner(GENERIC_AUTH_ERROR);
        oldRef.current?.focus();
        return;
      }
      if (isSessionError(err)) {
        onSessionExpired();
        return;
      }
      setBanner(message);
    } finally {
      setSaving(false);
    }
  }

  // Three typed passwords must never vanish on a stray Escape or outside click.
  const hasDraft = Boolean(oldPassword || next || confirm);
  const guardDismiss = (event: Event) => {
    if (hasDraft) event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-lg border-[#E2E8F0] bg-white ring-0 sm:max-w-[440px]"
        onEscapeKeyDown={guardDismiss}
        onPointerDownOutside={guardDismiss}
      >
        <form onSubmit={(event) => void submit(event)}>
          <DialogHeader>
            <DialogTitle className="font-heading text-[18px] font-bold text-[#1e293b]">
              Change password
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748B]">
              Enter your old password, then pick a new one. You stay signed in on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-5">
            {banner && (
              <div
                role="alert"
                className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]"
              >
                {banner}
              </div>
            )}
            <div>
              <label className={LABEL_CLASSES} htmlFor="password-old">
                Old password
              </label>
              <input
                id="password-old"
                ref={oldRef}
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                aria-invalid={oldError ? true : undefined}
                aria-describedby={oldError ? "password-old-error" : undefined}
                autoComplete="current-password"
                className={FIELD_CLASSES}
              />
              {oldError && (
                <p id="password-old-error" className="mt-1.5 text-[12.5px] text-[#DC2626]">
                  {oldError}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLASSES} htmlFor="password-new">
                New password
              </label>
              <input
                id="password-new"
                ref={nextRef}
                type="password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                aria-invalid={nextError ? true : undefined}
                aria-describedby={nextError ? "password-new-error" : "password-new-hint"}
                autoComplete="new-password"
                className={FIELD_CLASSES}
              />
              {nextError ? (
                <p id="password-new-error" className="mt-1.5 text-[12.5px] text-[#DC2626]">
                  {nextError}
                </p>
              ) : (
                <p id="password-new-hint" className="mt-1.5 text-[12.5px] text-[#64748B]">
                  At least 8 characters, different from the old one.
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLASSES} htmlFor="password-confirm">
                Confirm new password
              </label>
              <input
                id="password-confirm"
                ref={confirmRef}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={confirmError ? true : undefined}
                aria-describedby={confirmError ? "password-confirm-error" : undefined}
                autoComplete="new-password"
                className={FIELD_CLASSES}
              />
              {confirmError && (
                <p id="password-confirm-error" className="mt-1.5 text-[12.5px] text-[#DC2626]">
                  {confirmError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-lg border-t border-[#E2E8F0] p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#334155] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-busy={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? "Updating…" : "Update password"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
