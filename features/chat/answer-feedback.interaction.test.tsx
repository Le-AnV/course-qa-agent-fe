// @vitest-environment jsdom
import React, { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerFeedback } from './answer-feedback';
import type { AnswerFeedback as Feedback } from './api';

// Keep the real form and its handlers; portals and focus trapping belong to Radix.
vi.mock('@/components/ui/dialog', () => {
  const container = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return { Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <div role="dialog">{children}</div> : null,
    DialogContent: container, DialogDescription: container, DialogFooter: container, DialogHeader: container, DialogTitle: container };
});
vi.mock('@/components/ui/app-select', () => ({
  AppSelect: ({ value, disabled, options }: { value: string; disabled: boolean; options: { value: string; label: string }[] }) =>
    <select value={value} disabled={disabled} onChange={() => {}}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>,
}));

function Harness() {
  const [state, setState] = useState<{ feedback?: Feedback; ticketId?: string }>({});
  return <AnswerFeedback messageId="answer-1" classId="class-1" question="Original question" answer="Complete answer"
    citations={[]} canCreateTicket {...state} onChange={(patch) => setState((current) => ({ ...current, ...patch }))} />;
}

describe('confirmed answer ticket interactions', () => {
  let host: HTMLDivElement;
  let root: Root;
  const requests: { url: string; method: string; body: unknown }[] = [];
  let rejectTicket = false;
  let feedbackResponse: Promise<Response> | undefined;
  let ticketReadFailures = 0;
  const ticket = { id: 'ticket-1', class_id: 'class-1', student_id: 'student-1', question: 'Original question',
    original_question: 'Original question', agent_answer: 'Complete answer', citations: [], source_message_id: 'answer-1',
    status: 'OPEN', created_at: '2026-01-01T00:00:00Z', replies: [] };

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    requests.length = 0;
    rejectTicket = false;
    feedbackResponse = undefined;
    ticketReadFailures = 0;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const path = String(url);
      requests.push({ url: path, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (path.endsWith('/feedback')) return feedbackResponse ?? new Response(JSON.stringify({ feedback: (JSON.parse(String(init?.body))).feedback }));
      if (path.endsWith('/ticket')) return rejectTicket
        ? new Response(JSON.stringify({ detail: 'Please retry sending.' }), { status: 503 })
        : new Response(JSON.stringify(ticket), { status: 201 });
      if (path.includes('/api/tickets/')) {
        if (ticketReadFailures-- > 0) return new Response(JSON.stringify({ detail: 'Ticket refresh failed' }), { status: 503 });
        return new Response(JSON.stringify(ticket));
      }
      return new Response(JSON.stringify([{ id: 'class-1', code: 'CLASS', name: 'Class name', status: 'ACTIVE' }]));
    });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const button = (label: string) => {
    const found = Array.from(host.querySelectorAll('button')).find((item) => item.textContent === label);
    if (!found) throw new Error(`Button not found: ${label}`);
    return found;
  };
  const click = async (label: string) => { await act(async () => button(label).click()); };
  const ticketPosts = () => requests.filter((item) => item.method === 'POST' && item.url.endsWith('/ticket'));

  it('Helpful, saved Not helpful, opening and Cancel never create a ticket', async () => {
    await act(async () => root.render(<Harness />));
    await click('Helpful');
    expect(host.textContent).not.toContain('Ask my teacher');
    expect(ticketPosts()).toHaveLength(0);
    let finish!: (response: Response) => void;
    feedbackResponse = new Promise((resolve) => { finish = resolve; });
    await act(async () => button('Not helpful').click());
    expect(host.textContent).toContain('Saving');
    expect(host.textContent).not.toContain('Ask my teacher');
    expect(button('Helpful').disabled).toBe(true);
    await act(async () => { finish(new Response(JSON.stringify({ feedback: 'not_helpful' }))); });
    await click('Ask my teacher');
    expect(host.textContent).toContain('Original question');
    expect(host.querySelector<HTMLTextAreaElement>('#ticket-agent-answer')?.value).toBe('Complete answer');
    await click('Cancel');
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(ticketPosts()).toHaveLength(0);
  });

  it('keeps details after failure and retries confirmation with the same message ID', async () => {
    await act(async () => root.render(<Harness />));
    await click('Not helpful');
    await click('Ask my teacher');
    const details = host.querySelector<HTMLTextAreaElement>('#ticket-question')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(details, 'Please explain this part');
      details.dispatchEvent(new Event('input', { bubbles: true }));
    });
    rejectTicket = true;
    await click('Confirm and send');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Please retry sending');
    expect(details.value).toBe('Please explain this part');
    expect(ticketPosts()).toHaveLength(1);
    rejectTicket = false;
    await act(async () => { button('Confirm and send').click(); button('Confirm and send').click(); });
    expect(ticketPosts()).toHaveLength(2);
    for (const post of ticketPosts()) {
      expect(post.url).toContain('/api/chat/messages/answer-1/ticket');
      expect(post.body).toEqual({ confirmed: true, details: 'Please explain this part' });
    }
    expect(host.textContent).toContain('ticket-1');
  });

  it('clears a stale ticket refresh error after a successful refresh', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await act(async () => root.render(<Harness />));
    await click('Not helpful');
    await click('Ask my teacher');
    ticketReadFailures = 1;
    await click('Confirm and send');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Ticket refresh failed');
    await act(async () => { vi.advanceTimersByTime(8000); });
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});
