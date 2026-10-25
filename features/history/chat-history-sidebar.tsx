'use client';

import * as React from 'react';
import {
  MessageSquare,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Pin,
  Search,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
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
} from './api';
import type { ChatSessionItem } from './types';

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

export interface ChatHistorySidebarProps {
  classId: string;
  activeSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat?: () => void;
  refreshTrigger?: number;
  className?: string;
}

export function ChatHistorySidebar({
  classId,
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger = 0,
  className,
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
      setSessions((prev) =>
        prev.map((session) => (session.id === updated.id ? updated : session))
      );
      setSessionToRename(null);
      toast.success('Conversation renamed.');
    } catch (err) {
      toast.error(`Rename failed: ${getHistoryErrorMessage(err)}`);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <aside
        aria-label="Chat history"
        className={cn(
          'flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Expanded title bar or the compact icon rail. */}
        {isCollapsed ? (
          <nav
            aria-label="Chat history navigation"
            className="flex shrink-0 flex-col items-center gap-2 border-b border-[#BFDBFE] bg-[#EFF6FF] px-1 py-3"
          >
            {onNewChat && (
              <button
                type="button"
                onClick={onNewChat}
                title="New chat"
                aria-label="New chat"
                className="rounded-lg p-2 text-[#2563EB] transition-colors hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Recent chats"
              aria-label="Open recent chats"
              className="rounded-lg p-2 text-[#2563EB] transition-colors hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              title="Pinned chats are not supported yet"
              aria-label="Pinned chats are not supported yet"
              className="cursor-not-allowed rounded-lg p-2 text-slate-300"
            >
              <Pin className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              title="Chat search is not supported yet"
              aria-label="Chat search is not supported yet"
              className="cursor-not-allowed rounded-lg p-2 text-slate-300"
            >
              <Search className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#BFDBFE] bg-[#EFF6FF] px-3">
            <span className="font-semibold text-sm text-[#1D4ED8]">Chat History</span>
            <div className="flex items-center">
              {onNewChat && (
                <button
                  type="button"
                  onClick={onNewChat}
                  title="Start a new chat"
                  aria-label="Start a new chat"
                  className="rounded-lg p-1.5 text-[#2563EB] transition-colors hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Collapse chat history"
                aria-label="Collapse chat history"
                aria-expanded="true"
                className="rounded-lg p-1.5 text-[#2563EB] transition-colors hover:bg-[#DBEAFE] hover:text-[#1D4ED8]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area: 4 States */}
        <div className={cn('flex flex-1 flex-col gap-1 overflow-y-auto p-2', isCollapsed && 'items-center')}>
          {/* 1. Loading State */}
          {isLoading && !isCollapsed && (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && error && !isCollapsed && (
            <div className="flex flex-col items-center justify-center p-4 text-center text-red-500 dark:text-red-400 gap-2 my-auto">
              <AlertCircle className="h-6 w-6 stroke-1.5" />
              <p className="text-xs">{error}</p>
              <button
                type="button"
                onClick={loadSessions}
                className="mt-1 text-xs px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          )}

          {/* 3. Empty State */}
          {!isLoading && !error && sessions.length === 0 && !isCollapsed && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 gap-2 my-auto">
              <MessageSquare className="h-8 w-8 stroke-1 opacity-40" />
              <p className="text-xs">No conversations yet</p>
            </div>
          )}

          {/* 4. Success State — Sessions list ordered newest first (AC-06) */}
          {!isCollapsed && !isLoading &&
            !error &&
            sessions.map((session) => {
              const isActive = activeSessionId === session.id;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'group relative flex flex-col w-full text-left p-2.5 rounded-lg transition-colors border',
                    isActive
                      ? 'bg-slate-200/80 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <MessageSquare
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate text-xs">
                        {session.title || 'Conversation'}
                      </span>
                    </div>

                    {/* Session actions stay beside each other and never select the row. */}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(session);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            openRenameDialog(session);
                          }
                        }}
                        title="Rename conversation"
                        aria-label={`Rename ${session.title || 'conversation'}`}
                        className={cn(
                          'p-1 rounded text-slate-400 hover:text-[#2563EB] hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </div>

                      {/* Delete Trigger Button (Opens Confirmation Modal) */}
                      <div
                        role="button"
                        tabIndex={0}
                        data-testid={`delete-session-btn-${session.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setSessionToDelete(session);
                          }
                        }}
                        title="Delete conversation"
                        aria-label={`Delete ${session.title || 'conversation'}`}
                        className={cn(
                          'p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Relative Timestamp */}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-6 mt-0.5">
                    {formatRelativeTime(session.updated_at)}
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

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
              <span className="font-semibold text-slate-900 dark:text-slate-100">
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
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {renameTitle.trim().length}/255 characters
              </p>
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
