"use client";

import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { GENERIC_AUTH_ERROR, validateNewPassword, validatePasswordConfirm } from "./validation";
import { errorMessage, isSessionError, profileApi } from "./api";

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
    if (!validate()) return;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => void submit(event)}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your old password, then pick a new one.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {banner && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t change the password</AlertTitle>
                <AlertDescription>{banner}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <Field data-invalid={oldError ? true : undefined}>
                <FieldLabel htmlFor="password-old">Old password</FieldLabel>
                <Input
                  id="password-old"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  aria-invalid={oldError ? true : undefined}
                  disabled={saving}
                  autoComplete="current-password"
                />
                {oldError && <FieldError>{oldError}</FieldError>}
              </Field>
              <Field data-invalid={nextError ? true : undefined}>
                <FieldLabel htmlFor="password-new">New password</FieldLabel>
                <Input
                  id="password-new"
                  type="password"
                  value={next}
                  onChange={(event) => setNext(event.target.value)}
                  aria-invalid={nextError ? true : undefined}
                  disabled={saving}
                  autoComplete="new-password"
                />
                {nextError && <FieldError>{nextError}</FieldError>}
              </Field>
              <Field data-invalid={confirmError ? true : undefined}>
                <FieldLabel htmlFor="password-confirm">Confirm new password</FieldLabel>
                <Input
                  id="password-confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  aria-invalid={confirmError ? true : undefined}
                  disabled={saving}
                  autoComplete="new-password"
                />
                {confirmError && <FieldError>{confirmError}</FieldError>}
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              Update password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
