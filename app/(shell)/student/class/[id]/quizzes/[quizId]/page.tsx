"use client";

import { useParams } from "next/navigation";
import { StudentQuizPlayer } from "@/features/quizzes/student-quiz-player";

export default function StudentQuizTakingPage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  return <StudentQuizPlayer key={`${id}:${quizId}`} classId={id} quizId={quizId} />;
}
