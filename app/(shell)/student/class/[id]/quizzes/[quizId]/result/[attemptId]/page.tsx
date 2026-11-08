"use client";

import { useParams } from "next/navigation";
import { StudentQuizPlayer } from "@/features/quizzes/student-quiz-player";

export default function StudentQuizResultPage() {
  const { id, quizId, attemptId } = useParams<{
    id: string;
    quizId: string;
    attemptId: string;
  }>();
  return (
    <StudentQuizPlayer
      key={`${id}:${quizId}:${attemptId}`}
      classId={id}
      quizId={quizId}
      initialAttemptId={attemptId}
    />
  );
}
