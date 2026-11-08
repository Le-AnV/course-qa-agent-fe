import { Badge } from "@/components/ui/badge";
import type { QuizAttemptStatus } from "@/lib/quiz-api";
import { cn } from "@/lib/utils";
import { attemptStatusLabel } from "./quiz-result-format";

const ATTEMPT_STATUS_CLASSES: Record<QuizAttemptStatus, string> = {
  SUBMITTED: "border-[#BFE3CC] bg-[#ECFDF3] text-[#137A4B]",
  IN_PROGRESS: "border-[#E8D5A4] bg-[#FFF8E7] text-[#8A6414]",
  EXPIRED: "border-[#DADADA] bg-[#F7F7F7] text-[#6F6F6F]",
};

export function AttemptStatusBadge({
  status,
  className,
}: {
  status: QuizAttemptStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto px-2 py-0.5 text-[11px] font-semibold",
        ATTEMPT_STATUS_CLASSES[status],
        className,
      )}
    >
      {attemptStatusLabel(status)}
    </Badge>
  );
}

export function PassBadge({
  isPassed,
  className,
}: {
  isPassed: boolean | null | undefined;
  className?: string;
}) {
  if (isPassed === null || isPassed === undefined) {
    return (
      <Badge
        variant="outline"
        className={cn("h-auto border-[#DADADA] bg-[#F7F7F7] px-2 py-0.5 text-[11px] font-semibold text-[#6F6F6F]", className)}
      >
        Not graded
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto px-2 py-0.5 text-[11px] font-semibold",
        isPassed
          ? "border-[#BFE3CC] bg-[#ECFDF3] text-[#137A4B]"
          : "border-[#E7C4BA] bg-[#FDF0EC] text-[#9D4C38]",
        className,
      )}
    >
      {isPassed ? "Passed" : "Failed"}
    </Badge>
  );
}

export function OfficialBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto border-[#B8D0E6] bg-[#EDF5FC] px-2 py-0.5 text-[11px] font-semibold text-[#294D72]",
        className,
      )}
    >
      Official
    </Badge>
  );
}
