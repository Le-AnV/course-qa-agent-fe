"use client";

import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage, isSessionError, profileApi, type MeProfile } from "./api";
import { PasswordDialog } from "./password-dialog";
import { initialsFor, roleBadgeLabel, validateDisplayName } from "./validation";

/** Suspense fallback for `app/(shell)/account/page.tsx` (spec §5). */
export function ProfileLoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

function ReadOnlyRow({
  label,
  children,
  separator = true,
}: {
  label: string;
  children: React.ReactNode;
  separator?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="truncate text-sm">{children}</span>
      </div>
      {separator && <Separator />}
    </>
  );
}

/**
 * Shared profile surface for every authenticated role (AI-29, spec §1–§3).
 * Identity header (monogram avatar + name + email + role badge), an editable
 * display-name card, and a security card that opens the password dialog.
 */
export function ProfilePanel({ signOut }: { signOut: () => void }) {
  const [profile, setProfile] = React.useState<MeProfile | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);

  const expireSession = React.useCallback(() => {
    toast.error("Session expired. Log in again to continue.");
    signOut();
  }, [signOut]);

  // NOTE: mount-time fetch only; load() sets state after await, never synchronously.
  const load = React.useCallback(async () => {
    setLoadError(null);
    try {
      const me = await profileApi.me();
      setProfile(me);
      setDraft(me.username);
      setNameError(null);
    } catch (err) {
      if (isSessionError(err)) {
        expireSession();
        return;
      }
      setLoadError("Couldn't load your profile. Check the connection and retry.");
    }
  }, [expireSession]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  /** AC-03 — rename; the updated /me re-renders the header, no reload. */
  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    const invalid = validateDisplayName(draft);
    setNameError(invalid);
    if (invalid) return;
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile(draft);
      setProfile(updated);
      setDraft(updated.username);
      setNameError(null);
      toast.success("Profile updated.");
    } catch (err) {
      if (isSessionError(err)) {
        expireSession();
        return;
      }
      setNameError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!profile && !loadError) return <ProfileLoadingSkeleton />;

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6">
        <Alert variant="destructive">
          <AlertTitle>Profile unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <div>
          <Button variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-12 pt-6">
      {/* (A) Identity header — the single memorable element (spec §1). */}
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
            {initialsFor(profile.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading truncate text-xl font-semibold tracking-tight">
              {profile.username}
            </h1>
            <Badge variant="secondary">{roleBadgeLabel(profile.role)}</Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {/* (B) Profile card — only the display name is editable (spec §2). */}
      <Card>
        <form onSubmit={(event) => void saveName(event)}>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your display name as it appears across the app.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field data-invalid={nameError ? true : undefined}>
                <FieldLabel htmlFor="profile-display-name">Display name</FieldLabel>
                <Input
                  id="profile-display-name"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-invalid={nameError ? true : undefined}
                  disabled={saving}
                  autoComplete="name"
                />
                {nameError && <FieldError>{nameError}</FieldError>}
              </Field>
            </FieldGroup>
            <div className="flex flex-col gap-3">
              <Separator />
              <ReadOnlyRow label="Email">{profile.email}</ReadOnlyRow>
              <ReadOnlyRow label="Role">
                <Badge variant="secondary">{roleBadgeLabel(profile.role)}</Badge>
              </ReadOnlyRow>
              <ReadOnlyRow label="Class" separator={false}>
                {profile.class_id ?? "Unassigned"}
              </ReadOnlyRow>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* (C) Security card — password change lives in a dialog (spec §1). */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" type="button" onClick={() => setPasswordOpen(true)}>
            Change password
          </Button>
        </CardContent>
      </Card>

      <PasswordDialog
        key={passwordOpen ? "open" : "closed"}
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onSessionExpired={expireSession}
      />
    </div>
  );
}
