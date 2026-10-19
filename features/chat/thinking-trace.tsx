'use client';

import * as React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reasoning trace for a Q&A answer. While the agent is working the steps
 * light up one by one; once the answer arrives the same list collapses into
 * a one-line summary ("Thought for 1.2s"). Steps come from the caller so a
 * real backend can stream its own trace into the same component.
 */
export function ThinkingTrace({
  steps,
  running = false,
  thinkingMs,
  className,
}: {
  steps: string[];
  running?: boolean;
  thinkingMs?: number;
  className?: string;
}) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setActiveStep((step) => (step < steps.length - 1 ? step + 1 : step));
    }, 700);
    return () => window.clearInterval(timer);
  }, [running, steps.length]);

  if (steps.length === 0) return null;

  if (!running) {
    return (
      <details className={cn('group mb-2', className)}>
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[11.5px] font-medium text-[#6F6F6F] hover:text-[#111111]">
          <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
          {typeof thinkingMs === 'number'
            ? `Thought for ${(thinkingMs / 1000).toFixed(1)}s`
            : 'Thought process'}
        </summary>
        <ol className="mt-1.5 space-y-1 border-l border-[#DADADA] pl-3">
          {steps.map((step) => (
            <li key={step} className="text-[12px] leading-relaxed text-[#6F6F6F]">
              {step}
            </li>
          ))}
        </ol>
      </details>
    );
  }

  return (
    <div
      className={cn(
        'mb-2 w-fit rounded-lg border border-[#DADADA] bg-[#F7F7F7] px-3 py-2',
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-[#6F6F6F]" />
        <span className="text-[11.5px] font-semibold text-[#111111]">Thinking</span>
      </div>
      <ol className="space-y-1">
        {steps.map((step, index) => (
          <li
            key={step}
            className={cn(
              'text-[12px] leading-relaxed transition-colors motion-reduce:transition-none',
              index <= activeStep ? 'text-[#111111]' : 'text-[#6F6F6F]',
            )}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
