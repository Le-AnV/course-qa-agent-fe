import type { StudentClass } from "@/lib/student-api";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

/**
 * Warm-start cache for class metadata.
 *
 * The shell sidebar, the class workspace banner and the classes grid all need
 * the same class records. Without a cache each one painted an empty/placeholder
 * state for the first few hundred ms of every page load and then swapped the
 * real names in — a visible flash of "Class workspace" and an empty Classes
 * list. Persisted in sessionStorage so it survives reloads in the same tab, and
 * scoped by token so a different login never sees the previous user's classes.
 */
const TTL_MS = 10 * 60_000;

type Entry<T> = { at: number; value: T };

function scope(): string {
  if (typeof window === "undefined") return "server";
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? token.slice(-16) : "anon";
  } catch {
    return "anon";
  }
}

const listKey = () => `qa.classes.${scope()}`;
const detailKey = (id: string) => `qa.class.${scope()}.${id}`;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry?.value || Date.now() - entry.at > TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value } satisfies Entry<T>));
  } catch {
    // Private mode / quota: the cache is an optimisation, never a requirement.
  }
}

export function cacheClasses(classes: StudentClass[]) {
  write(listKey(), classes);
  for (const cls of classes) write(detailKey(cls.id), cls);
}

export function cacheClassDetail(cls: StudentClass) {
  write(detailKey(cls.id), cls);
}

export function peekClasses(): StudentClass[] | null {
  return read<StudentClass[]>(listKey());
}

export function peekClassDetail(id: string): StudentClass | null {
  return read<StudentClass>(detailKey(id)) ?? peekClasses()?.find((cls) => cls.id === id) ?? null;
}

export function clearClassCache() {
  if (typeof window === "undefined") return;
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith("qa.class")) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing to do — storage is unavailable.
  }
}
