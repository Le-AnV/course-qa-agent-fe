'use client';

import * as React from 'react';

type ChatScrollAreaProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Chat transcript scroller with a minimal overlay scrollbar: no native
 * arrows/track, a single charcoal pill that appears on hover or while
 * scrolling, and drag support. Native scrollbar is hidden.
 */
export function ChatScrollArea({ children, className = '' }: ChatScrollAreaProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = React.useRef(false);
  const dragRef = React.useRef<{ startY: number; startTop: number; ratio: number } | null>(null);

  const [thumb, setThumb] = React.useState({ top: 0, height: 0 });
  const [hasOverflow, setHasOverflow] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  const update = React.useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const overflow = el.scrollHeight > el.clientHeight + 1;
    setHasOverflow(overflow);
    if (!overflow) return;

    const trackHeight = track.clientHeight;
    const height = Math.max(28, Math.min(trackHeight, Math.round(trackHeight * (el.clientHeight / el.scrollHeight))));
    const maxScroll = el.scrollHeight - el.clientHeight;
    const top = maxScroll > 0 ? Math.round((el.scrollTop / maxScroll) * (trackHeight - height)) : 0;
    setThumb((prev) => (prev.top === top && prev.height === height ? prev : { top, height }));
  }, []);

  const reveal = React.useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!dragRef.current && !hoveringRef.current) setVisible(false);
    }, 1000);
  }, []);

  const scheduleHide = React.useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!dragRef.current && !hoveringRef.current) setVisible(false);
    }, 400);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    update();
    const onScroll = () => {
      update();
      reveal();
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [update, reveal]);

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    event.preventDefault();
    const maxThumbTop = Math.max(1, track.clientHeight - thumb.height);
    dragRef.current = {
      startY: event.clientY,
      startTop: el.scrollTop,
      ratio: (el.scrollHeight - el.clientHeight) / maxThumbTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    reveal();
  };

  const onThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!el || !drag) return;
    el.scrollTop = drag.startTop + (event.clientY - drag.startY) * drag.ratio;
  };

  const onThumbPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    scheduleHide();
  };

  return (
    <div
      className="relative flex-1 min-h-0"
      onMouseEnter={() => {
        hoveringRef.current = true;
        reveal();
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
        scheduleHide();
      }}
    >
      <div ref={scrollRef} className={`h-full overflow-y-auto scrollbar-none ${className}`}>
        {children}
      </div>

      <div ref={trackRef} aria-hidden="true" className="absolute top-2 bottom-2 right-1 z-20 w-1.5">
        <div
          style={{ height: `${thumb.height}px`, transform: `translateY(${thumb.top}px)` }}
          className={`w-full rounded-full bg-[#111111]/35 transition-opacity duration-200 hover:bg-[#111111]/55 ${
            hasOverflow && visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
        />
      </div>
    </div>
  );
}
