"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@/components/shared/PageShell";
import { StudentQuizAttempts } from "@/features/quizzes/student-quiz-attempts";

export default function StudentQuizAttemptsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  return (
    <PageContainer>
      <StudentQuizAttempts key={quizId} quizId={quizId} />
    </PageContainer>
  );
}
