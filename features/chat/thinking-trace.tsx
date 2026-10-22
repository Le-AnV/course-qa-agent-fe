import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Show only reached progress stages while the answer is streaming. */
export function ThinkingTrace({
  steps,
  activeStep = 0,
  completed = false,
  running = false,
  thinkingMs,
  className,
}: {
  steps: string[];
  activeStep?: number;
  completed?: boolean;
  running?: boolean;
  thinkingMs?: number;
  className?: string;
}) {
  if (steps.length === 0) return null;

  const lastVisibleStep = Math.min(activeStep, steps.length - 1);
  const visibleSteps = steps.slice(0, lastVisibleStep + 1);

  if (!running) {
    return (
      <details className={cn('group mb-2', className)}>
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[11.5px] font-medium text-[#6F6F6F] hover:text-[#111111]">
          <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
          {typeof thinkingMs === 'number'
            ? `Thought for ${(thinkingMs / 1000).toFixed(1)}s`
            : 'Thought process'}
        </summary>
        <ol className="mt-1.5 space-y-1.5">
          {visibleSteps.map((step, index) => (
            <li key={step} className="flex items-start gap-2 text-[12px] leading-relaxed text-[#4D4D4D]">
              {completed || index < lastVisibleStep ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4B9E76]" aria-hidden="true" />
              ) : (
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-center text-[#6F6F6F]" aria-hidden="true">•</span>
              )}
              <span>{index === lastVisibleStep && !completed ? <strong>{step}</strong> : step}</span>
            </li>
          ))}
        </ol>
      </details>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'mb-2 w-fit rounded-lg border border-[#DADADA] bg-[#F7F7F7] px-3 py-2',
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-[#6F6F6F]" />
        <span className="text-[11.5px] font-semibold text-[#111111]">Thinking</span>
      </div>
      <ol className="space-y-1.5">
        {visibleSteps.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-2 text-[12px] leading-relaxed text-[#4D4D4D]"
          >
            {index < lastVisibleStep ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4B9E76]" aria-hidden="true" />
            ) : (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#2563EB]" aria-hidden="true" />
            )}
            <span>{index === lastVisibleStep ? <strong>{step}</strong> : step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
