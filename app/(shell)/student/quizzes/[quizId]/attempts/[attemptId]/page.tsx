"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/shared/PageShell";
import { StudentQuizResult } from "@/features/quizzes/student-quiz-result";

export default function StudentQuizResultPage() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  return (
    <PageContainer>
      <StudentQuizResult key={`${quizId}:${attemptId}`} quizId={quizId} attemptId={attemptId} />
    </PageContainer>
  );
}
