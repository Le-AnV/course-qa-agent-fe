import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

type ChatSessionRole = "teacher" | "student";

const PREFIX = "qa.chat.session";

function scope(): string {
  if (typeof window === "undefined") return "server";
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? token.slice(-16) : "anon";
  } catch {
    return "anon";
  }
}

function keyFor(role: ChatSessionRole, classId: string): string {
  return `${PREFIX}.${scope()}.${role}.${classId}`;
}

export function readChatSession(role: ChatSessionRole, classId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(keyFor(role, classId));
  } catch {
    return null;
  }
}

export function writeChatSession(
  role: ChatSessionRole,
  classId: string,
  sessionId: string | null,
) {
  if (typeof window === "undefined") return;
  try {
    const key = keyFor(role, classId);
    if (sessionId) window.sessionStorage.setItem(key, sessionId);
    else window.sessionStorage.removeItem(key);
  } catch {
    return;
  }
}

export function clearChatSessionCache() {
  if (typeof window === "undefined") return;
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    return;
  }
}
