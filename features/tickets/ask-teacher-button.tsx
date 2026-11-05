'use client';

import * as React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { studentApi, type StudentClass } from '@/lib/student-api';
import { createAnswerTicket } from './api';
import type { ChatCitation } from '@/lib/sse';
import { CitationChip } from '@/features/citations/citation-chip';
import { citationKey } from '@/lib/citations';
import { TicketCitations } from './ticket-citations';
import { addTicketReply, createTicket, getStudentTicket, reopenTicket, resolveTicket, type Ticket, type TicketReply } from './api';

export function AskTeacherButton({
  classId,
  question,
  selection,
  feedbackContext,
}: {
  classId: string;
  question: string;
  selection?: { text: string; left: number; top: number };
  feedbackContext?: { messageId: string; answer: string; citations: ChatCitation[]; ticketId?: string | null; onCreated?: (ticketId: string) => void };
}) {
  const [open, setOpen] = React.useState(false);
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState(feedbackContext ? classId : '');
  const [studentQuestion, setStudentQuestion] = React.useState('');
  const [agentAnswer, setAgentAnswer] = React.useState('');
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [replies, setReplies] = React.useState<TicketReply[]>([]);
  const [followUp, setFollowUp] = React.useState('');
  const [loadingClasses, setLoadingClasses] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submitLock = React.useRef(false);
  const feedbackMode = Boolean(feedbackContext);

  React.useEffect(() => {
    if (!open || ticket) return;
    let cancelled = false;
    studentApi.classes()
      .then((result) => {
        if (cancelled) return;
        const available = result.filter((item) => item.status !== "ARCHIVED");
        setClasses(available);
        const initial = available.some((item) => item.id === classId) ? classId : '';
        setSelectedClassId(feedbackMode ? classId : initial);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load your classes.');
      })
      .finally(() => {
        if (!cancelled) setLoadingClasses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, classId, ticket, feedbackMode]);

  const activeTicketId = ticket?.id ?? feedbackContext?.ticketId;
  React.useEffect(() => {
    if (!open || !activeTicketId) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const current = await getStudentTicket(activeTicketId);
        if (!cancelled) {
          setTicket(current);
          setReplies(current.replies);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load the ticket.');
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [open, activeTicketId]);

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || !selectedClassId || (!feedbackContext && !studentQuestion.trim())) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const created = feedbackContext ? await createAnswerTicket(feedbackContext.messageId, studentQuestion.trim()) : await createTicket({
        class_id: selectedClassId,
        question: studentQuestion.trim(),
        original_question: question,
        agent_answer: agentAnswer,
      });
      setTicket(created);
      feedbackContext?.onCreated?.(created.id);
      setReplies([]);
      setStudentQuestion('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the ticket.');
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  async function submitFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !followUp.trim()) return;
    const message = followUp.trim();
    setSubmitting(true);
    setError(null);
    try {
      const saved = await addTicketReply(ticket.id, message);
      setReplies((current) => [...current, saved]);
      setTicket((current) =>
        current && current.status === 'ANSWERED' ? { ...current, status: 'OPEN' } : current,
      );
      setFollowUp('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add your message.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmResolved() {
    if (!ticket) return;
    setSubmitting(true);
    setError(null);
    try {
      setTicket(await resolveTicket(ticket.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm resolution.');
    } finally {
      setSubmitting(false);
    }
  }

  async function reopenResolved() {
    if (!ticket) return;
    setSubmitting(true);
    setError(null);
    try {
      setTicket(await reopenTicket(ticket.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reopen the ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {(selection || feedbackContext) && !open && <Button
        type="button"
        variant="ghost"
        size="sm"
        className={feedbackContext ? 'h-7 text-xs' : 'fixed z-[60] h-7 gap-1.5 bg-white px-2 text-xs text-[#5A5A5A] shadow-md'}
        style={feedbackContext ? undefined : { left: selection?.left, top: selection?.top }}
        aria-haspopup="dialog"
        data-ask-teacher-action
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={() => {
          if (!ticket) {
            setAgentAnswer(feedbackContext?.answer ?? selection?.text ?? '');
            setStudentQuestion('');
          }
          setFollowUp('');
          if (!ticket) {
            setClasses([]);
            setSelectedClassId(feedbackContext ? classId : '');
          }
          setError(null);
          setLoadingClasses(!ticket);
          setOpen(true);
        }}
      >
        <MessageSquarePlus aria-hidden="true" />
        {activeTicketId ? 'Open ticket' : 'Ask my teacher'}
      </Button>}
      <Dialog open={open} onOpenChange={(value) => { if (!submitting) setOpen(value); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          {ticket ? (
            <>
              <DialogHeader>
                <DialogTitle>Ticket created</DialogTitle>
                <DialogDescription>
                  Ticket ID: <span className="font-mono">{ticket.id}</span>
                  <span className="block">Status: {ticket.status} · Class: {classes.find((item) => item.id === ticket.class_id)?.code ?? ticket.class_id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-[#E5E5E5] p-3 text-sm">
                <TicketCitations citations={ticket.citations} />
                {ticket.original_question && <p className="whitespace-pre-wrap">{ticket.original_question}</p>}
                {ticket.agent_answer && <div className="space-y-1">
                  <p className="text-xs font-medium text-[#777]">Agent answer</p>
                  <p className="whitespace-pre-wrap rounded-md bg-[#F7F7F7] p-2">{ticket.agent_answer}</p>
                </div>}
                <p className="font-medium">{ticket.question}</p>
                {replies.map((item) => (
                  <div key={item.id} className="rounded-md bg-[#F7F7F7] p-2">
                    <p className="mb-1 text-xs text-[#777]">{item.user_id === ticket.student_id ? 'You' : 'Teacher'}</p>
                    <p className="whitespace-pre-wrap">{item.message}</p>
                  </div>
                ))}
              </div>
              {ticket.status === 'ANSWERED' && <p className="text-sm">Your teacher has replied. Ask a follow-up below or confirm that your question is resolved.</p>}
              {(ticket.status === 'OPEN' || ticket.status === 'ANSWERED') && <form onSubmit={submitFollowUp} className="space-y-3">
                <label className="block space-y-1.5 text-sm font-medium" htmlFor={`ticket-follow-up-${ticket.id}`}>
                  Add details or a follow-up
                  <textarea
                    id={`ticket-follow-up-${ticket.id}`}
                    value={followUp}
                    onChange={(event) => setFollowUp(event.target.value)}
                    maxLength={10000}
                    rows={3}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
                  {ticket.status === 'ANSWERED' && (
                    <Button type="button" variant="outline" disabled={submitting} onClick={confirmResolved}>
                      {submitting ? 'Saving…' : 'Confirm resolved'}
                    </Button>
                  )}
                  <Button type="submit" disabled={submitting || !followUp.trim()}>
                    {submitting ? 'Sending…' : 'Send follow-up'}
                  </Button>
                </DialogFooter>
              </form>}
              {ticket.status === 'EXPIRED' && <p className="text-sm text-[#6F6F6F]">This ticket expired after seven days without an answer.</p>}
              {ticket.status === 'RESOLVED' && <>
                <p className="text-sm text-[#6F6F6F]">This ticket is marked as resolved.</p>
                <Button type="button" variant="outline" disabled={submitting} onClick={reopenResolved}>
                  {submitting ? 'Saving…' : 'Reopen ticket'}
                </Button>
              </>}
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            </>
          ) : activeTicketId ? (
            <><DialogHeader><DialogTitle>Open ticket</DialogTitle><DialogDescription>Loading ticket…</DialogDescription></DialogHeader>
              {error && <p role="alert">{error}</p>}
              <Button onClick={() => { setOpen(false); }}>Close</Button></>
          ) : (
            <form onSubmit={submitTicket} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Ask my teacher</DialogTitle>
                <DialogDescription>
                  This creates a ticket for your teacher. You can add more details after it is created.
                </DialogDescription>
              </DialogHeader>
              <label className="block space-y-1.5 text-sm font-medium" htmlFor="ticket-class">
                Class
                <AppSelect
                  id="ticket-class"
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                  options={classes.map((item) => ({
                    value: item.id,
                    label: `${item.code} · ${item.name}`,
                  }))}
                  placeholder={
                    loadingClasses
                      ? 'Loading classes…'
                      : classes.length === 0
                        ? 'No active classes'
                        : 'Select a class'
                  }
                  disabled={Boolean(feedbackContext) || loadingClasses || classes.length === 0}
                  aria-label="Class"
                  triggerClassName="w-full"
                />
              </label>
              {feedbackContext && <p className="text-sm">Class: {classes.find((item) => item.id === classId)?.name ?? classId}</p>}
              <div className="space-y-1.5 text-sm">
                <p className="font-medium">Original question</p>
                <p className="max-h-28 overflow-y-auto rounded-md bg-[#F7F7F7] p-3 text-[#444]">{question}</p>
              </div>
              <label className="block space-y-1.5 text-sm font-medium" htmlFor="ticket-agent-answer">
                Agent answer
                <textarea id="ticket-agent-answer" value={agentAnswer} readOnly rows={3}
                  className="w-full rounded-md border border-[#DADADA] bg-[#F7F7F7] px-3 py-2 text-sm font-normal" />
              </label>
              {feedbackContext?.citations.map((citation) => <CitationChip key={citationKey(citation)} citation={citation} />)}
              <label className="block space-y-1.5 text-sm font-medium" htmlFor="ticket-question">
                {feedbackContext ? 'Additional details (optional)' : 'Your question'}
                <textarea
                  id="ticket-question"
                  value={studentQuestion}
                  onChange={(event) => setStudentQuestion(event.target.value)}
                  placeholder="What would you like your teacher to explain?"
                  required={!feedbackContext}
                  disabled={submitting}
                  maxLength={10000}
                  rows={3}
                  className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting || loadingClasses || !selectedClassId || (!feedbackContext && !studentQuestion.trim())}>
                  {submitting ? 'Creating…' : feedbackContext ? 'Confirm and send' : 'Create ticket'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
