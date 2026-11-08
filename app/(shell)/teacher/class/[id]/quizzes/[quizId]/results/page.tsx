"use client";

import { useParams } from "next/navigation";
import { QuizResults } from "@/features/quizzes/quiz-results";

export default function QuizResultsPage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  return <QuizResults key={`${id}:${quizId}`} classId={id} quizId={quizId} />;
}
