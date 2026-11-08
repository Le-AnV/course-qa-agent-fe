"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import { QuizList } from "@/features/quizzes/quiz-list";

export default function QuizzesPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-5">
      <ClassPageHeader
        title="Quizzes"
        subtitle="Import from Excel, then review, approve and export."
        actions={
          <Button asChild variant="outline">
            <Link href={`/teacher/class/${id}/quizzes/import`}>
              <Upload /> Import quiz
            </Link>
          </Button>
        }
      />
      <QuizList classId={id} />
    </div>
  );
}
