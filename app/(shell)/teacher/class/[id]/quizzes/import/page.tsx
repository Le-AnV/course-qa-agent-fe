"use client";

import { useParams } from "next/navigation";
import { QuizExcelImport } from "@/features/quizzes/quiz-excel-import";

export default function QuizImportPage() {
  const { id } = useParams<{ id: string }>();
  // Key on the class so switching classes starts with a clean import form and
  // does not carry the previous class' file/preview/list state.
  return <QuizExcelImport key={id} classId={id} />;
}
