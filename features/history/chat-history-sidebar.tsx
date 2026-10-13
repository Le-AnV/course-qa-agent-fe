'use client';

import * as React from 'react';
import { MessageSquare, Trash2, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { getSessions, deleteSession, getHistoryErrorMessage } from './api';
import type { ChatSessionItem } from './types';

/**
 * Format ISO 8601 date string to friendly relative time in Vietnamese.
 */
function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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

  // State for delete confirmation modal
  const [sessionToDelete, setSessionToDelete] = React.useState<ChatSessionItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
      toast.success('Đã xóa cuộc trò chuyện thành công');
      if (activeSessionId === targetId) {
        onNewChat?.();
      }
      setSessionToDelete(null);
    } catch (err) {
      toast.error(`Xóa thất bại: ${getHistoryErrorMessage(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <aside
        aria-label="Lịch sử trò chuyện"
        className={cn(
          'w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm',
          className
        )}
      >
        {/* Header with Title and "New Chat" button */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Chat History
          </span>
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              title="Bắt đầu cuộc trò chuyện mới"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main Content Area: 4 States */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {/* 1. Loading State */}
          {isLoading && (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center p-4 text-center text-red-500 dark:text-red-400 gap-2 my-auto">
              <AlertCircle className="h-6 w-6 stroke-1.5" />
              <p className="text-xs">{error}</p>
              <button
                type="button"
                onClick={loadSessions}
                className="mt-1 text-xs px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" /> Thử lại
              </button>
            </div>
          )}

          {/* 3. Empty State */}
          {!isLoading && !error && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 gap-2 my-auto">
              <MessageSquare className="h-8 w-8 stroke-1 opacity-40" />
              <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
            </div>
          )}

          {/* 4. Success State — Sessions list ordered newest first (AC-06) */}
          {!isLoading &&
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
                        {session.title || 'Cuộc trò chuyện'}
                      </span>
                    </div>

                    {/* Delete Trigger Button (Opens Confirmation Modal) */}
                    <div
                      role="button"
                      tabIndex={0}
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
                      title="Xóa cuộc trò chuyện"
                      className={cn(
                        'p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setSessionToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                &ldquo;{sessionToDelete?.title || 'Cuộc trò chuyện'}&rdquo;
              </span>
              ? Hành động này sẽ xóa toàn bộ nội dung tin nhắn và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setSessionToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
