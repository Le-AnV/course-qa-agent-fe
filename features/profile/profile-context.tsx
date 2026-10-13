"use client";

import * as React from "react";
import { profileApi, type MeProfile, isSessionError } from "./api";

/**
 * Shared profile for the authenticated shell (AI-29).
 * One `/me` call feeds the sidebar identity block and /account, so renaming
 * on /account updates the sidebar immediately without a reload.
 */
export type ProfileValue = {
  profile: MeProfile | null;
  loading: boolean;
  error: string | null;
  /** True when /me answered 401/403 — the session must be renewed. */
  sessionExpired: boolean;
  setProfile: (profile: MeProfile) => void;
  refresh: () => Promise<void>;
};

const ProfileContext = React.createContext<ProfileValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = React.useState<MeProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const me = await profileApi.me();
      setProfileState(me);
      setSessionExpired(false);
    } catch (err) {
      if (isSessionError(err)) {
        // Let <AuthGuard> bounce to /login; consumers may show a toast.
        setSessionExpired(true);
        return;
      }
      setError("Couldn't load your profile. Check the connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; state is only set after the await.
    void load();
  }, [load]);

  const value = React.useMemo<ProfileValue>(
    () => ({
      profile,
      loading,
      error,
      sessionExpired,
      setProfile: setProfileState,
      refresh: load,
    }),
    [profile, loading, error, sessionExpired, load],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileValue {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used inside <ProfileProvider>.");
  }
  return ctx;
}
