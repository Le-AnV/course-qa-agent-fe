import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnswerFeedback } from './answer-feedback';
import { saveAnswerFeedback } from './api';
import { createAnswerTicket } from '@/features/tickets/api';

describe('answer feedback', () => {
  afterEach(() => vi.restoreAllMocks());
  const props = { messageId: 'answer-1', classId: 'class-1', question: 'Question', answer: 'Answer', citations: [], canCreateTicket: true, onChange: () => {} };

  it('restores Helpful without offering or creating a ticket on render', () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const html = renderToStaticMarkup(<AnswerFeedback {...props} feedback="helpful" />);
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('Ask my teacher');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('offers a dialog only for saved negative feedback with identified context', () => {
    const html = renderToStaticMarkup(<AnswerFeedback {...props} feedback="not_helpful" />);
    expect(html).toContain('Ask my teacher');
    const legacy = renderToStaticMarkup(<AnswerFeedback {...props} feedback="not_helpful" canCreateTicket={false} />);
    expect(legacy).not.toContain('Ask my teacher');
    expect(legacy).toContain('original question could not be identified');
  });

  it('keeps an existing ticket available after changing feedback', () => {
    const html = renderToStaticMarkup(<AnswerFeedback {...props} feedback="helpful" ticketId="ticket-1" />);
    expect(html).toContain('Open ticket');
  });

  it('sends feedback separately from a confirmed ticket request', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ feedback: 'not_helpful', id: 'ticket-1' })));
    await saveAnswerFeedback('answer-1', 'not_helpful');
    expect(fetch.mock.calls[0][0]).toContain('/api/chat/messages/answer-1/feedback');
    expect(fetch.mock.calls[0][1]?.method).toBe('PUT');
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ feedback: 'not_helpful' });
    expect(fetch).toHaveBeenCalledTimes(1);
    await createAnswerTicket('answer-1', 'Details');
    expect(fetch.mock.calls[1][0]).toContain('/api/chat/messages/answer-1/ticket');
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({ confirmed: true, details: 'Details' });
  });
});
