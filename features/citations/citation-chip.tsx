'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import { cn } from '@/lib/utils';
import type { ChatCitation } from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Fetch the cited file; PDFs come back with the used passages already highlighted. */
async function fetchSource(citation: ChatCitation, token: string): Promise<Response> {
  const base = `${API_URL}/api/chat/sources/${encodeURIComponent(citation.documentId ?? '')}`;
  const headers = { Authorization: `Bearer ${token}` };

  if (citation.page !== null && citation.highlights.length > 0) {
    const highlighted = await fetch(`${base}/highlight`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: citation.page, passages: citation.highlights }),
    });
    if (highlighted.ok) return highlighted;
    // 415 = not a PDF; any other failure also falls back to the plain file.
  }
  return fetch(base, { headers });
}

async function openClassSource(citation: ChatCitation) {
  const viewer = window.open('', '_blank');
  if (viewer) viewer.opener = null;

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !citation.documentId) {
      throw new Error('This source file is not available.');
    }

    const response = await fetchSource(citation, token);
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { detail?: string } | null;
      throw new Error(body?.detail || 'The source file could not be opened.');
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    // #page jumps the browser's PDF viewer straight to the cited page.
    const target = citation.page === null ? objectUrl : `${objectUrl}#page=${citation.page}`;
    if (viewer) viewer.location.href = target;
    else window.open(target, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    viewer?.close();
    toast.error(error instanceof Error ? error.message : 'The source file could not be opened.');
  }
}

type CardPosition = {
  top: number;
  left: number;
  width: number;
  /** Which side of the chip the card sits on, so it can grow out of the chip. */
  above: boolean;
  /** Horizontal offset of the chip centre inside the card: the transform origin. */
  originX: number;
};

/** Only one citation card may be open at a time. */
let activeCard: { token: string; close: () => void } | null = null;

export function CitationChip({ citation }: { citation: ChatCitation }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<CardPosition | null>(null);
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  // Stable per-chip identity, so the shared registry can tell cards apart.
  const token = React.useId();

  const close = React.useCallback(() => {
    if (activeCard?.token === token) activeCard = null;
    setIsOpen(false);
    setPosition(null);
  }, [token]);

  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }
    if (activeCard && activeCard.token !== token) activeCard.close();
    activeCard = { token, close };
    setPosition(null);
    setIsOpen(true);
  };

  // The card floats above the transcript and overflows the chat card when the chip
  // sits near an edge, so it is positioned against the viewport instead of the chip.
  const placeCard = React.useCallback(() => {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;

    const margin = 12;
    const gap = 10;
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(320, viewportWidth - margin * 2);
    const height = card.offsetHeight;
    const left = Math.min(
      Math.max(rect.left, margin),
      Math.max(margin, viewportWidth - width - margin),
    );
    const aboveEdge = rect.top - height - gap;
    const belowEdge = rect.bottom + gap;
    // Keep the card inside the viewport: above the chip when it fits, else below,
    // and never closer than `margin` to the edges.
    const isAbove = aboveEdge >= margin;
    const top = isAbove
      ? aboveEdge
      : Math.max(margin, Math.min(belowEdge, viewportHeight - height - margin));
    const originX = Math.min(Math.max(rect.left + rect.width / 2 - left, 16), width - 16);

    setPosition((previous) =>
      previous &&
      previous.top === top &&
      previous.left === left &&
      previous.width === width &&
      previous.above === isAbove &&
      previous.originX === originX
        ? previous
        : { top, left, width, above: isAbove, originX },
    );
  }, []);

  // Measure as soon as the portalled card commits; no effect-driven setState needed.
  const attachCard = React.useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      if (node) placeCard();
    },
    [placeCard],
  );

  React.useEffect(() => {
    if (!isOpen) return;

    const reposition = () => placeCard();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (anchorRef.current?.contains(target) || cardRef.current?.contains(target))
      ) {
        return;
      }
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', reposition);
    // Capture phase so scrolling inside the transcript also moves the card.
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [close, isOpen, placeCard]);

  React.useEffect(
    () => () => {
      if (activeCard?.token === token) activeCard = null;
    },
    [token],
  );

  const isCurriculum = citation.kind === 'curriculum';
  const markers = citation.indexes.length > 0 ? citation.indexes : [citation.index];
  const markerLabel = markers.map((marker) => `[${marker}]`).join('');
  const label = isCurriculum
    ? `${markerLabel} ${citation.title}${
        citation.page === null ? '' : ` · Page ${citation.page}`
      }`
    : `${markerLabel} ${citation.title}`;

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    close();
    if (citation.url) {
      window.open(citation.url, '_blank', 'noopener,noreferrer');
    } else {
      void openClassSource(citation);
    }
  };

  return (
    <span ref={anchorRef} className="relative inline-block align-baseline">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md bg-[#F7F7F7] px-2 py-0.5 text-xs font-medium text-[#5A5A5A] ring-1 ring-inset ring-[#DADADA] transition-colors hover:bg-slate-100',
          isOpen ? 'text-[#111111] ring-[#B8B8B8]' : 'hover:text-[#111111]',
        )}
        onClick={toggle}
      >
        {citation.url ? (
          <svg
            className="w-3 h-3 text-slate-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 text-blue-500 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        )}
        <span className="truncate max-w-[240px]">{label}</span>
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={attachCard}
              role="dialog"
              aria-label={`${markerLabel} ${citation.title}`}
              style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                width: position?.width ?? 320,
                visibility: position ? 'visible' : 'hidden',
                transformOrigin: position
                  ? `${position.originX}px ${position.above ? '100%' : '0'}`
                  : '50% 100%',
              }}
              className={cn(
                'fixed z-[80] rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xl',
                'transition-none motion-reduce:animate-none',
                'animate-in fade-in-0 duration-150 ease-out',
                position?.above ? 'slide-in-from-bottom-1' : 'slide-in-from-top-1',
              )}
            >
              {position ? (
                <span
                  aria-hidden
                  style={{ left: Math.round(position.originX) - 5 }}
                  className={cn(
                    'absolute h-2.5 w-2.5 rotate-45 border-slate-200 bg-white',
                    position.above
                      ? '-bottom-[5.5px] border-b border-r'
                      : '-top-[5.5px] border-l border-t',
                  )}
                />
              ) : null}
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                    {markerLabel}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 truncate" title={citation.title}>
                    {citation.title}
                  </span>
                </div>
                {isCurriculum && citation.page !== null ? (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                    Trang {citation.page}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    Web
                  </span>
                )}
              </div>

              {/* Snippet / Quote Body */}
              {citation.snippet ? (
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-700 leading-relaxed italic line-clamp-4">
                  “{citation.snippet}”
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-1">
                  Trích đoạn nguồn tài liệu được dùng cho câu trả lời.
                </div>
              )}

              {/* Footer Action */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">
                  {isCurriculum ? 'Tài liệu khóa học' : 'Nguồn Internet'}
                </span>
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <span>{isCurriculum ? 'Mở tài liệu' : 'Xem trang web'}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
