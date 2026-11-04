'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { saveAnswerFeedback, type AnswerFeedback as Feedback } from './api';
import { AskTeacherButton } from '@/features/tickets/ask-teacher-button';
import type { ChatCitation } from '@/lib/sse';

export function AnswerFeedback({ messageId, feedback, ticketId, canCreateTicket, classId, question, answer, citations, onChange }: {
  messageId: string; feedback?: Feedback | null; ticketId?: string | null;
  canCreateTicket: boolean; classId: string; question: string; answer: string; citations: ChatCitation[];
  onChange: (patch: { feedback?: Feedback; ticketId?: string }) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lock = React.useRef(false);

  async function choose(choice: Feedback) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const saved = await saveAnswerFeedback(messageId, choice);
      onChange({ feedback: saved.feedback });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save feedback. Please retry.');
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <motion.div
    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="mb-3 space-y-2 text-xs"
    aria-label="Answer feedback"
  >
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-medium text-[#6F6F6F]">Was this answer helpful?</span>
      <button
        type="button"
        disabled={pending}
        aria-pressed={feedback === 'helpful'}
        aria-busy={pending}
        onClick={() => void choose('helpful')}
        className="inline-flex h-7 w-24 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-[#DADADA] bg-white px-2 text-[11px] font-medium leading-none text-[#525252] shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[#AFCBBF] hover:bg-[#F3F8F5] hover:text-[#216E5A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-ink)] aria-pressed:border-[#AFCBBF] aria-pressed:bg-[#EDF5F0] aria-pressed:font-semibold aria-pressed:text-[#216E5A] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <ThumbsUp aria-hidden="true" className="size-3 shrink-0" />
        Helpful
      </button>
      <button
        type="button"
        disabled={pending}
        aria-pressed={feedback === 'not_helpful'}
        aria-busy={pending}
        onClick={() => void choose('not_helpful')}
        className="inline-flex h-7 w-24 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-[#DADADA] bg-white px-2 text-[11px] font-medium leading-none text-[#525252] shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[#E2B9AE] hover:bg-[#FBF5F4] hover:text-[#9D4C38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-ink)] aria-pressed:border-[#E2B9AE] aria-pressed:bg-[#FBF2EF] aria-pressed:font-semibold aria-pressed:text-[#9D4C38] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <ThumbsDown aria-hidden="true" className="size-3 shrink-0" />
        Not helpful
      </button>
      {pending && <span role="status" className="text-[11px] text-[#6F6F6F]">Saving…</span>}
    </div>
    <AnimatePresence initial={false}>
      {error && <motion.p
        key="feedback-error"
        initial={reduceMotion ? false : { opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
        transition={{ duration: 0.16 }}
        role="alert"
        className="text-[11.5px] text-[#9D3F35]"
      >{error}</motion.p>}
    </AnimatePresence>
    <AnimatePresence initial={false}>
      {!pending && (ticketId || (feedback === 'not_helpful' && canCreateTicket)) && <motion.div
        key="ask-teacher"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <AskTeacherButton
          classId={classId} question={question}
          feedbackContext={{ messageId, answer, citations, ticketId, onCreated: (id) => onChange({ ticketId: id }) }}
        />
      </motion.div>}
    </AnimatePresence>
    {feedback === 'not_helpful' && !canCreateTicket && !ticketId && <p className="text-[11.5px] text-[#6F6F6F]">The original question could not be identified. You can still ask your teacher by selecting answer text.</p>}
  </motion.div>;
}
