"use client";

import { useParams } from "next/navigation";
import { QuizReview } from "@/features/quizzes/quiz-review";

export default function QuizReviewPage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  return <QuizReview key={`${id}:${quizId}`} classId={id} quizId={quizId} />;
}
