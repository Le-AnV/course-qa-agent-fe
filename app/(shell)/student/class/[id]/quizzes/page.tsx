"use client";

import { useParams } from "next/navigation";
import { StudentQuizList } from "@/features/quizzes/student-quiz-list";

export default function StudentQuizzesPage() {
  const { id } = useParams<{ id: string }>();
  return <StudentQuizList key={id} classId={id} />;
}
