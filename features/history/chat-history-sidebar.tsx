'use client';

import * as React from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import {
  getSessions,
  deleteSession,
  renameSession,
  getHistoryErrorMessage,
  searchSessions,
  togglePinSession,
} from './api';
import { splitHighlightParts } from './search-highlight';
import { readHistoryCollapsed, writeHistoryCollapsed } from './history-prefs';
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

/** One letter is enough to tell conversations apart in the 64 px rail. */
function railInitial(session: ChatSessionItem): string {
  const title = session.title?.trim();
  return title ? title[0].toUpperCase() : '';
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
  /** Mobile drawer (< md). Desktop always renders the persistent panel. */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

/**
 * Chat history has two shapes of the *same* surface:
 * - desktop: a 256 px panel that collapses to a 64 px rail (state persisted).
 * - mobile (< md): a left drawer opened from the chat header.
 *
 * Both shapes share one 56 px header row, so switching states never reflows the
 * panel's contents vertically — the bug that made collapsing feel unstable.
 */
export function ChatHistorySidebar({
  classId,
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger = 0,
  className,
  mobileOpen = false,
  onMobileOpenChange,
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = React.useState<ChatSessionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // State for delete confirmation modal
  const [sessionToDelete, setSessionToDelete] = React.useState<ChatSessionItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // State for rename dialog
  const [sessionToRename, setSessionToRename] = React.useState<ChatSessionItem | null>(null);
  const [renameTitle, setRenameTitle] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);

  // State for 3-dots actions menu
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const handleTogglePin = async (session: ChatSessionItem) => {
    const nextPin = !session.is_pinned;
    setOpenMenuId(null);
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

  // Restore the last shape before paint; the server/first client render is expanded.
  useIsomorphicLayoutEffect(() => {
    setIsCollapsed(readHistoryCollapsed());
  }, []);

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    writeHistoryCollapsed(collapsed);
  };

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
    <div className="relative px-2 pb-1.5 pt-2" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6F6F6F]" />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search conversations..."
        aria-label="Search conversations"
        data-testid="search-history-input"
        className="w-full rounded-md border border-[#DADADA] bg-[#F7F7F7] py-1.5 pl-8 pr-8 text-[12px] text-[#111111] placeholder:text-[#9F9F9F] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]/20"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6F6F6F] hover:text-[#111111]"
          aria-label="Clear search"
          data-testid="search-history-clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const iconButton =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6F6F6F] transition-colors hover:bg-[#EDEDED] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20 disabled:cursor-not-allowed disabled:opacity-40';

  const states = (compact: boolean) => {
    if (!compact && (isSearching || searchResults !== null || searchError !== null)) {
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
            <p className="text-[12px] text-[#5A5A5A]">{searchError}</p>
            <button
              type="button"
              onClick={() => setSearchRetryKey((key) => key + 1)}
              className="mt-1 flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-2.5 py-1 text-[12px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
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
            <p className="text-[12px] text-[#6F6F6F]">No results found</p>
          </div>
        );
      }

      if (searchResults !== null) {
        return (
          <div aria-live="polite">
            <p className="px-2 pb-1 text-[11px] text-[#6F6F6F]">
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
                <p className="truncate text-[12.5px] font-medium text-[#111111]">
                  <HighlightedText
                    text={result.title ?? 'Conversation'}
                    keyword={searchQuery}
                  />
                </p>
                {result.snippet && result.snippet !== result.title && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[#6F6F6F]">
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
      return compact ? (
        <div className="flex flex-col items-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      );
    }

    if (error) {
      return compact ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title={error}
          aria-label={`Chat history failed to load: ${error}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9D4C38] hover:bg-[#F7F7F7]"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center gap-2 p-3 text-center">
          <AlertCircle className="h-6 w-6 stroke-1.5 text-[#9D4C38]" />
          <p className="text-[12px] text-[#5A5A5A]">{error}</p>
          <button
            type="button"
            onClick={loadSessions}
            className="mt-1 flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-2.5 py-1 text-[12px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      );
    }

    if (sessions.length === 0) {
      if (compact) return null;
      return (
        <div className="my-auto flex flex-col items-center justify-center gap-2 p-4 text-center">
          <MessageSquare className="h-7 w-7 stroke-1 text-[#CFCFCF]" />
          <p className="text-[12px] text-[#6F6F6F]">No conversations yet</p>
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
            'group relative flex items-start gap-1 rounded-lg border px-1 py-1 transition-colors',
            isActive
              ? 'border-[var(--brand-line)] bg-[var(--brand-soft)]'
              : 'border-transparent hover:bg-[#F7F7F7]',
            isMenuOpen && 'bg-[#F7F7F7] z-30',
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenuId(null);
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
                  'block truncate text-[12.5px]',
                  isActive ? 'font-semibold text-[#111111]' : 'font-medium text-[#111111]',
                )}
              >
                {label}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-[#6F6F6F]">
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
                setOpenMenuId(isMenuOpen ? null : session.id);
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

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-[#DADADA] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-75"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleTogglePin(session);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
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
                    openRenameDialog(session);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
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
                    setSessionToDelete(session);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#9D4C38] hover:bg-[#FDF2F2] transition-colors text-left"
                >
                  <Trash2 className="h-3.5 w-3.5 text-[#9D4C38]" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (compact) {
      return (
        <div className="flex flex-col items-center gap-1.5">
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const initial = railInitial(session);
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => selectSession(session.id)}
                title={session.title || 'Conversation'}
                aria-label={`Open ${session.title || 'conversation'}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
                  isActive
                    ? 'border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                    : 'border-transparent bg-[#F7F7F7] text-[#5A5A5A] hover:border-[#DADADA] hover:text-[#111111]',
                )}
              >
                {session.is_pinned && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#111111]"
                    title="Pinned conversation"
                  >
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </span>
                )}
                {initial ? initial : <MessageSquare className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      );
    }

    const pinnedSessions = sessions.filter((s) => s.is_pinned);
    const recentSessions = sessions.filter((s) => !s.is_pinned);

    if (pinnedSessions.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-center gap-1 px-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#8F8F8F]">
              <Pin className="h-3 w-3 rotate-45" />
              <span>Pinned</span>
            </div>
            <div className="flex flex-col gap-1">
              {pinnedSessions.map((session) => renderSessionItem(session))}
            </div>
          </div>

          <div>
            <div className="px-1.5 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#8F8F8F]">
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
        className={cn(
          // Width snaps instead of animating: animating it reflowed the whole
          // transcript (865 -> 1057 px) on every frame of the toggle.
          'hidden shrink-0 flex-col overflow-hidden rounded-xl border border-[#DADADA] bg-white shadow-sm md:flex',
          isCollapsed ? 'w-16' : 'w-64',
          className,
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-[#DADADA] bg-[#F7F7F7]',
            isCollapsed ? 'justify-center' : 'justify-between pl-3 pr-1.5',
          )}
        >
          {!isCollapsed && (
            <span className="truncate text-[13px] font-semibold text-[#111111]">Chat History</span>
          )}
          <div className="flex items-center gap-0.5">
            {!isCollapsed && onNewChat && (
              <button
                type="button"
                onClick={startNewChat}
                title="Start a new chat"
                aria-label="Start a new chat"
                className={iconButton}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand chat history' : 'Collapse chat history'}
              aria-label={isCollapsed ? 'Expand chat history' : 'Collapse chat history'}
              aria-expanded={!isCollapsed}
              aria-controls="chat-history-panel"
              className={iconButton}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div
          id="chat-history-panel"
          className={cn(
            'flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2',
            isCollapsed && 'items-center',
          )}
        >
          {/* In the rail, "new chat" is an item like the conversations. */}
          {isCollapsed && onNewChat && (
            <button
              type="button"
              onClick={startNewChat}
              title="New chat"
              aria-label="Start a new chat"
              className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-[#CFCFCF] text-[#111111] transition-colors hover:border-[#111111] hover:bg-[#F7F7F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {!isCollapsed && renderSearchBox()}
          {states(isCollapsed)}
        </div>
      </aside>

      {/* Mobile: the same panel as a drawer, opened from the chat header. */}
      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-y-0 left-0 top-0 h-full w-[86vw] max-w-[320px] translate-x-0 translate-y-0 gap-0 rounded-none rounded-r-xl border-r border-[#DADADA] bg-white p-0 sm:max-w-[320px]"
        >
          <DialogTitle className="sr-only">Chat history</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a past conversation from this class or start a new one.
          </DialogDescription>

          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#DADADA] bg-[#F7F7F7] pl-3 pr-1.5">
            <span className="truncate text-[13px] font-semibold text-[#111111]">Chat History</span>
            <div className="flex items-center gap-0.5">
              {onNewChat && (
                <button
                  type="button"
                  onClick={startNewChat}
                  title="Start a new chat"
                  aria-label="Start a new chat"
                  className={iconButton}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <DialogClose asChild>
                <button type="button" title="Close" aria-label="Close chat history" className={iconButton}>
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
            {renderSearchBox()}
            {states(false)}
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
                className="text-[12.5px] font-medium text-[#111111]"
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
              <p className="text-[12px] text-[#6F6F6F]">{renameTitle.trim().length}/255 characters</p>
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
