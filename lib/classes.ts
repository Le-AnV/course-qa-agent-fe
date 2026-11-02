/**
 * Mock lớp học dùng chung (tạm thời tới khi BE có API classes).
 * Sidebar + trang My Classes + banner workspace đọc cùng 1 nguồn
 * để không lệch data (số lớp, tên lớp, mã lớp).
 */
export type ClassInfo = {
  id: string;
  code: string;
  title: string;
  term: string;
  dept: string;
  teacherName: string;
  accentColor: string;
  units: number;
  resources: number;
  /** Dòng stats hiển thị trên card, vd "12 units · 28 resources" */
  stats: string;
  members: number;
};

export const CLASSES: ClassInfo[] = [
  {
    id: "cs-401",
    code: "CS 401",
    title: "Introduction to Artificial Intelligence",
    term: "Fall 2026",
    dept: "Computer Science",
    teacherName: "Minh",
    accentColor: "#1F3A5F",
    units: 12,
    resources: 28,
    stats: "12 units · 28 resources",
    members: 34,
  },
  {
    id: "se-301",
    code: "SE 301",
    title: "Software Engineering",
    term: "Fall 2026",
    dept: "Software Engineering",
    teacherName: "Minh",
    accentColor: "#2B4C73",
    units: 10,
    resources: 22,
    stats: "10 units · 22 resources",
    members: 42,
  },
  {
    id: "cs-310",
    code: "CS 310",
    title: "Machine Learning Foundations",
    term: "Spring 2026",
    dept: "Computer Science",
    teacherName: "Minh",
    accentColor: "#3A5F88",
    units: 8,
    resources: 15,
    stats: "8 units · 15 resources",
    members: 28,
  },
];

/** Lớp student được enroll (sidebar student + chip mobile). */
export const STUDENT_CLASS_IDS = ["cs-401", "se-301"];

export function getClassById(id: string): ClassInfo | undefined {
  return CLASSES.find((c) => c.id === id);
}

export function classesForRole(role: string): ClassInfo[] {
  if (role === "student") {
    return CLASSES.filter((c) => STUDENT_CLASS_IDS.includes(c.id));
  }
  return CLASSES;
}
