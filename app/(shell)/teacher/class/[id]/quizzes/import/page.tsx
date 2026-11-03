"use client";

import { useParams } from "next/navigation";
import { QuizExcelImport } from "@/features/quizzes/quiz-excel-import";

export default function QuizImportPage() {
  const { id } = useParams<{ id: string }>();
  return <QuizExcelImport classId={id} />;
}
