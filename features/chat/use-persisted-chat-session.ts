"use client";

import * as React from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { readChatSession, writeChatSession } from "@/lib/chat-session-cache";

type ChatSessionRole = "teacher" | "student";

export function usePersistedChatSession(role: ChatSessionRole, classId: string) {
  const [activeSessionId, setActiveSessionIdState] = React.useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    setActiveSessionIdState(readChatSession(role, classId));
  }, [role, classId]);

  const setActiveSessionId = React.useCallback(
    (sessionId: string | null) => {
      setActiveSessionIdState(sessionId);
      writeChatSession(role, classId, sessionId);
    },
    [role, classId],
  );

  const startNewChat = React.useCallback(() => {
    setActiveSessionIdState(null);
    writeChatSession(role, classId, null);
  }, [role, classId]);

  return { activeSessionId, setActiveSessionId, startNewChat };
}
