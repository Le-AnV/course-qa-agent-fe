'use client';

import * as React from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import { readHistoryCollapsed, writeHistoryCollapsed } from './history-prefs';

/**
 * Desktop chat-history visibility, persisted across visits.
 *
 * Collapsed means the column animates its width down to zero, so the chat
 * transcript takes the full width. The chat header toggle brings it back.
 */
export function useHistoryPanel() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Restore the last shape before paint; the server/first client render is expanded.
  useIsomorphicLayoutEffect(() => {
    setIsCollapsed(readHistoryCollapsed());
  }, []);

  const setCollapsed = React.useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    writeHistoryCollapsed(collapsed);
  }, []);

  return { isCollapsed, setCollapsed };
}
