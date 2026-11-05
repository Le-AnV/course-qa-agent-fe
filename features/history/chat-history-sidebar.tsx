'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getSessions,
  deleteSession,
  renameSession,
  getHistoryErrorMessage,
  searchSessions,
  togglePinSession,
} from './api';
import { splitHighlightParts } from './search-highlight';
import type { ChatSessionItem, SearchResultItem } from './types';

/**
 * Format ISO 8601 date string to friendly relative time in English.
 */
function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
  return (
    <>
      {splitHighlightParts(text, keyword).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-sm bg-yellow-100 px-0.5 text-yellow-900">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        ),
      )}
    </>
  );
}

export function sortSessionsWithPinned(items: ChatSessionItem[]): ChatSessionItem[] {
  return [...items].sort((a, b) => {
    const aPinned = Boolean(a.is_pinned);
    const bPinned = Boolean(b.is_pinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (aPinned && bPinned) {
      const aPinTime = a.pinned_at ? new Date(a.pinned_at).getTime() : Number.POSITIVE_INFINITY;
      const bPinTime = b.pinned_at ? new Date(b.pinned_at).getTime() : Number.POSITIVE_INFINITY;
      if (aPinTime !== bPinTime) return aPinTime - bPinTime;
    }
    const aTime = new Date(a.updated_at).getTime();
    const bTime = new Date(b.updated_at).getTime();
    return bTime - aTime;
  });
}

export interface ChatHistorySidebarProps {
  classId: string;
  activeSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat?: () => void;
  refreshTrigger?: number;
  className?: string;
  /** Desktop placement; the mobile drawer follows the same side. */
  side?: 'left' | 'right';
  /** Desktop: when true the history column is collapsed away and the chat takes the width. */
  collapsed?: boolean;
  /** Mobile drawer (< md). Desktop keeps the column mounted so it can animate. */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

/**
 * Chat history has two shapes of the *same* surface:
 * - desktop: a 256 px panel that animates its width down to zero when collapsed.
 * - mobile (< md): a left drawer opened from the chat header.
 *
 * The desktop toggle lives in the chat header's right corner, so it stays in
 * the same place whether the column is open or closed.
 */
export function ChatHistorySidebar({
  classId,
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger = 0,
  className,
  side = 'left',
  collapsed = false,
  mobileOpen = false,
  onMobileOpenChange,
}: ChatHistorySidebarProps) {
  const isRight = side === 'right';
  const [sessions, setSessions] = React.useState<ChatSessionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for delete confirmation modal
  const [sessionToDelete, setSessionToDelete] = React.useState<ChatSessionItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // State for rename dialog
  const [sessionToRename, setSessionToRename] = React.useState<ChatSessionItem | null>(null);
  const [renameTitle, setRenameTitle] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);

  // State for 3-dots actions menu
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [menuCoords, setMenuCoords] = React.useState<{ top: number; left: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const activeTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        (!activeTriggerRef.current || !activeTriggerRef.current.contains(e.target as Node))
      ) {
        setOpenMenuId(null);
        setMenuCoords(null);
      }
    };
    const handleScroll = () => {
      setOpenMenuId(null);
      setMenuCoords(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenuId]);

  const handleTogglePin = async (session: ChatSessionItem) => {
    const nextPin = !session.is_pinned;
    setOpenMenuId(null);
    setMenuCoords(null);
    // Optimistic update
    setSessions((prev) =>
      sortSessionsWithPinned(
        prev.map((s) =>
          s.id === session.id
            ? {
                ...s,
                is_pinned: nextPin,
                pinned_at: nextPin ? new Date().toISOString() : null,
              }
            : s,
        ),
      ),
    );

    try {
      const updated = await togglePinSession(session.id, nextPin);
      setSessions((prev) =>
        sortSessionsWithPinned(prev.map((s) => (s.id === updated.id ? updated : s))),
      );
      toast.success(nextPin ? 'Pinned conversation to top.' : 'Unpinned conversation.');
    } catch (err) {
      // Rollback
      setSessions((prev) =>
        sortSessionsWithPinned(
          prev.map((s) => (s.id === session.id ? session : s)),
        ),
      );
      toast.error(`Pin action failed: ${getHistoryErrorMessage(err)}`);
    }
  };

  // Search state (AI-101 AC-01, AC-02, AC-03, AC-04)
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searchRetryKey, setSearchRetryKey] = React.useState(0);
  const searchRequestId = React.useRef(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const requestId = ++searchRequestId.current;
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setSearchError(null);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchSessions(trimmed, classId);
        if (requestId !== searchRequestId.current) return;
        setSearchResults(res.items);
      } catch (err) {
        if (requestId !== searchRequestId.current) return;
        setSearchResults(null);
        setSearchError(getHistoryErrorMessage(err));
      } finally {
        if (requestId === searchRequestId.current) setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Invalidate any in-flight request when query/class changes or unmounts.
      searchRequestId.current += 1;
    };
  }, [searchQuery, classId, searchRetryKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch past chat sessions for the current class
  const loadSessions = React.useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSessions(classId);
      setSessions(data);
    } catch (err) {
      setError(getHistoryErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  React.useEffect(() => {
    let isMounted = true;
    if (!classId) return;

    getSessions(classId)
      .then((data) => {
        if (isMounted) setSessions(data);
      })
      .catch((err) => {
        if (isMounted) setError(getHistoryErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [classId, refreshTrigger]);

  const selectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    onMobileOpenChange?.(false);
  };

  const startNewChat = () => {
    onNewChat?.();
    onMobileOpenChange?.(false);
  };

  // Execute deletion after user confirms in dialog (AC-05)
  const handleConfirmDelete = async () => {
    if (!sessionToDelete || isDeleting) return;

    setIsDeleting(true);
    const targetId = sessionToDelete.id;
    try {
      await deleteSession(targetId);
      setSessions((prev) => prev.filter((s) => s.id !== targetId));
      toast.success('Conversation deleted.');
      if (activeSessionId === targetId) {
        onNewChat?.();
      }
      setSessionToDelete(null);
    } catch (err) {
      toast.error(`Delete failed: ${getHistoryErrorMessage(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openRenameDialog = (session: ChatSessionItem) => {
    setSessionToRename(session);
    setRenameTitle(session.title ?? '');
  };

  const handleConfirmRename = async () => {
    if (!sessionToRename || isRenaming) return;

    const title = renameTitle.trim();
    if (!title || title === sessionToRename.title) return;

    setIsRenaming(true);
    try {
      const updated = await renameSession(sessionToRename.id, title);
      setSessions((prev) => prev.map((session) => (session.id === updated.id ? updated : session)));
      setSessionToRename(null);
      toast.success('Conversation renamed.');
    } catch (err) {
      toast.error(`Rename failed: ${getHistoryErrorMessage(err)}`);
    } finally {
      setIsRenaming(false);
    }
  };

  const renderSearchBox = () => (
    <div className="relative" role="search">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6F6F6F]" />
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search conversations..."
        aria-label="Search conversations"
        data-testid="search-history-input"
        className="w-full rounded-md border border-[#DADADA] bg-[#F7F7F7] py-1.5 pl-8 pr-8 text-[12px] text-[#111111] placeholder:text-[#9F9F9F] focus:border-[var(--brand-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-line)] [&::-webkit-search-cancel-button]:hidden"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6F6F] hover:text-[#111111]"
          aria-label="Clear search"
          data-testid="search-history-clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const iconButton =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--brand-ink)] transition-colors hover:bg-white/60 hover:text-[var(--brand-ink-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-line)] disabled:cursor-not-allowed disabled:opacity-40';

  const states = () => {
    if (isSearching || searchResults !== null || searchError !== null) {
      if (isSearching) {
        return (
          <div className="space-y-2 p-2" aria-busy="true" aria-live="polite">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        );
      }

      if (searchError) {
        return (
          <div
            className="my-auto flex flex-col items-center justify-center gap-2 p-4 text-center"
            role="alert"
          >
            <AlertCircle className="h-6 w-6 stroke-1.5 text-[#9D4C38]" />
            <p className="text-[11.5px] text-[#5A5A5A]">{searchError}</p>
            <button
              type="button"
              onClick={() => setSearchRetryKey((key) => key + 1)}
              className="mt-1 flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        );
      }

      if (searchResults !== null && searchResults.length === 0) {
        return (
          <div
            className="my-auto flex flex-col items-center justify-center gap-2 p-4 text-center"
            aria-live="polite"
          >
            <Search className="h-7 w-7 stroke-1 text-[#CFCFCF]" />
            <p className="text-[11.5px] text-[#6F6F6F]">No results found</p>
          </div>
        );
      }

      if (searchResults !== null) {
        return (
          <div aria-live="polite">
            <p className="px-2 pb-1 text-[10.5px] text-[#6F6F6F]">
              {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
            </p>
            {searchResults.map((result) => (
              <button
                key={result.session_id}
                type="button"
                data-testid={`search-result-${result.session_id}`}
                aria-current={activeSessionId === result.session_id ? 'true' : undefined}
                onClick={() => {
                  selectSession(result.session_id);
                  setSearchQuery('');
                }}
                className="w-full rounded-lg border border-transparent px-2 py-2 text-left hover:bg-[#F7F7F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
              >
                <p className="truncate text-[11.5px] font-medium text-[#111111]">
                  <HighlightedText
                    text={result.title ?? 'Conversation'}
                    keyword={searchQuery}
                  />
                </p>
                {result.snippet && result.snippet !== result.title && (
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] text-[#6F6F6F]">
                    <HighlightedText text={result.snippet} keyword={searchQuery} />
                  </p>
                )}
              </button>
            ))}
          </div>
        );
      }
    }

    if (isLoading) {
      return (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="my-auto flex flex-col items-center justify-center gap-2 p-3 text-center">
          <AlertCircle className="h-6 w-6 stroke-1.5 text-[#9D4C38]" />
          <p className="text-[11.5px] text-[#5A5A5A]">{error}</p>
          <button
            type="button"
            onClick={loadSessions}
            className="mt-1 flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="my-auto flex flex-col items-center justify-center gap-2 p-4 text-center">
          <MessageSquare className="h-7 w-7 stroke-1 text-[#CFCFCF]" />
          <p className="text-[11.5px] text-[#6F6F6F]">No conversations yet</p>
          {onNewChat && (
            <button
              type="button"
              onClick={startNewChat}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-line)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Start a new chat
            </button>
          )}
        </div>
      );
    }

    const renderSessionItem = (session: ChatSessionItem) => {
      const isActive = activeSessionId === session.id;
      const label = session.title || 'Conversation';
      const isMenuOpen = openMenuId === session.id;

      return (
        <div
          key={session.id}
          className={cn(
            'group relative flex items-start gap-1 rounded-lg border px-1.5 py-1.5 transition-colors',
            isActive
              ? 'border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm'
              : 'border-transparent hover:bg-[#F7F7F7]',
            isMenuOpen && 'bg-[#F7F7F7] z-30',
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenuId(null);
              setMenuCoords(null);
              selectSession(session.id);
            }}
            aria-current={isActive ? 'true' : undefined}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
          >
            {session.is_pinned ? (
              <Pin className="h-3.5 w-3.5 shrink-0 text-[#111111] rotate-45" />
            ) : (
              <MessageSquare
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  isActive ? 'text-[var(--brand-ink)]' : 'text-[#6F6F6F]',
                )}
              />
            )}
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-[12px]',
                  isActive ? 'font-semibold text-[#111111]' : 'font-medium text-[#111111]',
                )}
              >
                {label}
              </span>
              <span className="mt-0.5 block truncate text-[10.5px] text-[#6F6F6F]">
                {formatRelativeTime(session.updated_at)}
              </span>
            </span>
          </button>

          {/* 3-dots action menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isMenuOpen) {
                  setOpenMenuId(null);
                  setMenuCoords(null);
                } else {
                  activeTriggerRef.current = e.currentTarget;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuWidth = 176;
                  const menuHeight = 135;

                  // Flyout to the right of the 3-dots button (+6px gap)
                  let left = rect.right + 6;
                  if (typeof window !== 'undefined' && left + menuWidth > window.innerWidth - 8) {
                    left = Math.max(8, rect.left - menuWidth - 6);
                  }

                  let top = rect.top;
                  if (typeof window !== 'undefined' && top + menuHeight > window.innerHeight - 8) {
                    top = Math.max(8, window.innerHeight - menuHeight - 8);
                  }

                  setMenuCoords({ top, left });
                  setOpenMenuId(session.id);
                }
              }}
              title="More options"
              aria-label={`More options for ${label}`}
              className={cn(
                'rounded p-1 text-[#6F6F6F] transition-all hover:bg-[#EDEDED] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
                isMenuOpen
                  ? 'opacity-100 bg-[#EDEDED] text-[#111111]'
                  : isActive
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen &&
              menuCoords &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: 'fixed',
                    top: `${menuCoords.top}px`,
                    left: `${menuCoords.left}px`,
                  }}
                  className="z-50 w-44 rounded-lg border border-[#DADADA] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-75"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuCoords(null);
                      void handleTogglePin(session);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                  >
                    {session.is_pinned ? (
                      <>
                        <PinOff className="h-3.5 w-3.5 text-[#6F6F6F]" />
                        <span>Unpin from top</span>
                      </>
                    ) : (
                      <>
                        <Pin className="h-3.5 w-3.5 text-[#6F6F6F] rotate-45" />
                        <span>Pin to top</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuCoords(null);
                      openRenameDialog(session);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#6F6F6F]" />
                    <span>Rename</span>
                  </button>
                  <div className="my-1 border-t border-[#EDEDED]" />
                  <button
                    type="button"
                    data-testid={`delete-session-btn-${session.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuCoords(null);
                      setSessionToDelete(session);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-[#9D4C38] hover:bg-[#FDF2F2] transition-colors text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#9D4C38]" />
                    <span>Delete</span>
                  </button>
                </div>,
                document.body,
              )}
          </div>
        </div>
      );
    };

    const pinnedSessions = sessions.filter((s) => s.is_pinned);
    const recentSessions = sessions.filter((s) => !s.is_pinned);

    if (pinnedSessions.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-center gap-1 px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8F8F8F]">
              <Pin className="h-3 w-3 rotate-45" />
              <span>Pinned</span>
            </div>
            <div className="flex flex-col gap-1">
              {pinnedSessions.map((session) => renderSessionItem(session))}
            </div>
          </div>

          <div>
            <div className="px-1.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8F8F8F]">
              <span>Recent</span>
            </div>
            <div className="flex flex-col gap-1">
              {recentSessions.map((session) => renderSessionItem(session))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {sessions.map((session) => renderSessionItem(session))}
      </div>
    );
  };

  return (
    <>
      <aside
        aria-label="Chat history"
        aria-hidden={collapsed || undefined}
        inert={collapsed || undefined}
        className={cn(
          'hidden shrink-0 overflow-hidden transition-all duration-300 ease-out md:block',
          collapsed ? 'ml-0 w-0 opacity-0' : 'ml-4 w-64 opacity-100',
          className,
        )}
      >
        <div className="ml-auto flex h-full w-64 flex-col overflow-hidden rounded-xl border border-[#DADADA] bg-white shadow-sm">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#45698B] bg-[linear-gradient(112deg,#294D72_0%,#365F85_68%,#47759A_100%)] px-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold text-white">
                Chat History
              </span>
              {sessions.length > 0 && (
                <span
                  className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-white/15 px-1 text-[10px] font-semibold leading-none text-white"
                  aria-label={`${sessions.length} conversations`}
                >
                  {sessions.length > 99 ? '99+' : sessions.length}
                </span>
              )}
            </span>
          </div>

          <div id="chat-history-panel" className="flex min-h-0 flex-1 flex-col">
            {/* Header, New chat and search stay put; only the list scrolls. */}
            <div className="shrink-0 space-y-1.5 px-2 pt-2">
              {onNewChat && (
                <button
                  type="button"
                  onClick={startNewChat}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-line)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New chat
                </button>
              )}
              {renderSearchBox()}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 pt-1">
              {states()}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: the same panel as a drawer, opened from the chat header. */}
      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'fixed inset-y-0 top-0 h-full w-[86vw] max-w-[320px] translate-x-0 translate-y-0 gap-0 rounded-none border-[#DADADA] bg-white p-0 sm:max-w-[320px]',
            isRight
              ? 'right-0 left-auto rounded-l-xl border-l'
              : 'left-0 right-auto rounded-r-xl border-r',
          )}
        >
          <DialogTitle className="sr-only">Chat history</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a past conversation from this class or start a new one.
          </DialogDescription>

          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#45698B] bg-[linear-gradient(112deg,#294D72_0%,#365F85_68%,#47759A_100%)] pl-3 pr-1.5">
            <span className="truncate text-[13.5px] font-semibold text-white">
              Chat History
            </span>
            <div className="flex items-center gap-0.5">
              <DialogClose asChild>
                <button
                  type="button"
                  title="Close"
                  aria-label="Close chat history"
                  className={cn(iconButton, 'text-white hover:bg-white/15 hover:text-white')}
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 space-y-1.5 px-2 pt-2">
              {onNewChat && (
                <button
                  type="button"
                  onClick={startNewChat}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-soft-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-line)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New chat
                </button>
              )}
              {renderSearchBox()}
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2 pt-1">
              {states()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before Deletion */}
      <Dialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open: boolean) => {
          if (!open && !isDeleting) {
            setSessionToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" data-testid="delete-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">
                &ldquo;{sessionToDelete?.title || 'Conversation'}&rdquo;
              </span>
              ? This removes all messages and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setSessionToDelete(null)}
              data-testid="cancel-delete-btn"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-2"
              data-testid="confirm-delete-btn"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog: keep the title editable without touching the transcript. */}
      <Dialog
        open={Boolean(sessionToRename)}
        onOpenChange={(open: boolean) => {
          if (!open && !isRenaming) {
            setSessionToRename(null);
            setRenameTitle('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleConfirmRename();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>
                Give this conversation a memorable name. The message content stays unchanged.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label
                htmlFor="rename-session-title"
                className="text-[11.5px] font-medium text-[#111111]"
              >
                Conversation title
              </label>
              <Input
                id="rename-session-title"
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                maxLength={255}
                autoFocus
                disabled={isRenaming}
                placeholder="e.g. Chapter 3 review"
              />
              <p className="text-[11px] text-[#6F6F6F]">{renameTitle.trim().length}/255 characters</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isRenaming}
                onClick={() => {
                  setSessionToRename(null);
                  setRenameTitle('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isRenaming ||
                  !renameTitle.trim() ||
                  renameTitle.trim() === (sessionToRename?.title ?? '')
                }
                className="gap-2"
              >
                {isRenaming && <Loader2 className="h-4 w-4 animate-spin" />}
                Save name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
