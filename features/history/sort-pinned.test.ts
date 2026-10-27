import { describe, expect, it } from 'vitest';
import { sortSessionsWithPinned } from './chat-history-sidebar';
import type { ChatSessionItem } from './types';

describe('sortSessionsWithPinned', () => {
  it('places pinned sessions before unpinned sessions', () => {
    const items: ChatSessionItem[] = [
      {
        id: '1',
        class_id: 'c1',
        title: 'Unpinned New',
        created_at: '2026-10-26T10:00:00Z',
        updated_at: '2026-10-26T12:00:00Z',
        is_pinned: false,
      },
      {
        id: '2',
        class_id: 'c1',
        title: 'Pinned Old',
        created_at: '2026-10-26T08:00:00Z',
        updated_at: '2026-10-26T09:00:00Z',
        is_pinned: true,
        pinned_at: '2026-10-26T09:00:00Z',
      },
    ];

    const sorted = sortSessionsWithPinned(items);
    expect(sorted.map((s) => s.id)).toEqual(['2', '1']);
  });

  it('sorts pinned sessions chronologically (first pinned comes first - FIFO)', () => {
    const items: ChatSessionItem[] = [
      {
        id: 'pin-second',
        class_id: 'c1',
        title: 'Pinned Later',
        created_at: '2026-10-26T08:00:00Z',
        updated_at: '2026-10-26T11:00:00Z',
        is_pinned: true,
        pinned_at: '2026-10-26T11:00:00Z',
      },
      {
        id: 'pin-first',
        class_id: 'c1',
        title: 'Pinned First',
        created_at: '2026-10-26T07:00:00Z',
        updated_at: '2026-10-26T09:00:00Z',
        is_pinned: true,
        pinned_at: '2026-10-26T09:00:00Z',
      },
      {
        id: 'pin-third',
        class_id: 'c1',
        title: 'Pinned Last',
        created_at: '2026-10-26T08:30:00Z',
        updated_at: '2026-10-26T12:00:00Z',
        is_pinned: true,
        pinned_at: '2026-10-26T12:00:00Z',
      },
      {
        id: 'unpinned-1',
        class_id: 'c1',
        title: 'Unpinned',
        created_at: '2026-10-26T06:00:00Z',
        updated_at: '2026-10-26T13:00:00Z',
        is_pinned: false,
      },
    ];

    const sorted = sortSessionsWithPinned(items);
    expect(sorted.map((s) => s.id)).toEqual([
      'pin-first',
      'pin-second',
      'pin-third',
      'unpinned-1',
    ]);
  });

  it('sorts unpinned sessions by updated_at descending', () => {
    const items: ChatSessionItem[] = [
      {
        id: 'unpinned-older',
        class_id: 'c1',
        title: 'Older update',
        created_at: '2026-10-26T08:00:00Z',
        updated_at: '2026-10-26T09:00:00Z',
        is_pinned: false,
      },
      {
        id: 'unpinned-newer',
        class_id: 'c1',
        title: 'Newer update',
        created_at: '2026-10-26T08:00:00Z',
        updated_at: '2026-10-26T10:00:00Z',
        is_pinned: false,
      },
    ];

    const sorted = sortSessionsWithPinned(items);
    expect(sorted.map((s) => s.id)).toEqual(['unpinned-newer', 'unpinned-older']);
  });
});
