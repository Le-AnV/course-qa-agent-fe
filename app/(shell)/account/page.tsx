"use client";

import * as React from "react";
import { useAuth } from "@/components/ui/auth-guard";
import { ProfileLoadingSkeleton, ProfilePanel } from "@/features/profile/profile-panel";

/**
 * Shared profile surface for every authenticated role (AI-29).
 * The shell layout already wraps this in <AuthGuard>; useAuth() here only
 * supplies signOut and holds a skeleton while a guest bounces to /login.
 */
export default function AccountPage() {
  const auth = useAuth();

  if (auth.status !== "authed") return <ProfileLoadingSkeleton />;

  return (
    <React.Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePanel signOut={auth.signOut} />
    </React.Suspense>
  );
}
