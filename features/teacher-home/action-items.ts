import type { StudentClass } from "@/lib/student-api";

/**
 * Teacher home is the "what needs me" surface instead of a second copy of
 * /teacher/classes. The only work item it can prove from the API today is a
 * pending join request: documents/roadmap presence turned out to be unreliable
 * (a class can have an indexed syllabus while the parsed roadmap is still empty),
 * so nothing else is inferred here.
 */
export type ActionItem = {
  /** Stable React key, one row per class. */
  key: string;
  classId: string;
  classCode: string;
  count: number;
  href: string;
  title: string;
  detail: string;
};

type ClassFacts = Pick<StudentClass, "id" | "code" | "name">;

/** Pending request count per class id; null = fetch failed, so no row. */
export type PendingByClass = Record<string, number | null | undefined>;

export function buildActionItems(classes: ClassFacts[], pending: PendingByClass): ActionItem[] {
  return classes
    .flatMap((cls) => {
      const count = pending[cls.id];
      if (!count || count < 1) return [];

      return [
        {
          key: `requests:${cls.id}`,
          classId: cls.id,
          classCode: cls.code,
          count,
          href: `/teacher/class/${cls.id}/members`,
          title: `${count} join request${count === 1 ? "" : "s"} waiting`,
          detail: `${cls.code} · ${cls.name}`,
        },
      ];
    })
    .sort((a, b) => a.classCode.localeCompare(b.classCode));
}
