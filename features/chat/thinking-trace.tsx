import { cn } from '@/lib/utils';

/**
 * One-line live progress. Only the current stage is visible; completed stages
 * are intentionally removed so the answer starts on a clean surface.
 */
export function ThinkingTrace({
  steps,
  activeStep = 0,
  completed = false,
  running = false,
  className,
}: {
  steps: string[];
  activeStep?: number;
  completed?: boolean;
  running?: boolean;
  className?: string;
}) {
  if (steps.length === 0 || completed || !running) return null;

  const current = steps[Math.min(activeStep, steps.length - 1)];
  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn('mb-2 flex items-center gap-2 text-[12px] leading-5', className)}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)] animate-pulse motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span key={current} className="thinking-stage font-medium">
        {current}
      </span>
    </div>
  );
}
