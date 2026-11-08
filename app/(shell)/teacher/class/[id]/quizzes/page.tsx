"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Sparkles, Upload } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import { QuizList } from "@/features/quizzes/quiz-list";
import { QuizBlueprintModal } from "@/features/quizzes/quiz-blueprint-modal";

export default function QuizzesPage() {
  const { id } = useParams<{ id: string }>();
  const [isBlueprintOpen, setIsBlueprintOpen] = React.useState(false);

  return (
    <div className="space-y-5">
      <ClassPageHeader
        title="Quizzes"
        subtitle="Generate standardized assessments from Question Bank blueprint matrix or import from Excel."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsBlueprintOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Sparkles className="h-4 w-4" /> Generate Quiz (AI Blueprint)
            </Button>
            <Button asChild variant="outline">
              <Link href={`/teacher/class/${id}/quizzes/import`}>
                <Upload className="h-4 w-4" /> Import quiz
              </Link>
            </Button>
          </div>
        }
      />
      <QuizList classId={id} />

      <QuizBlueprintModal
        open={isBlueprintOpen}
        classId={id}
        onClose={() => setIsBlueprintOpen(false)}
      />
    </div>
  );
}
