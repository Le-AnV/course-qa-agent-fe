"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type AdminUser, type ClassSection, type Course } from "@/lib/admin-api";

/**
 * Courses & classes (AC-01, AC-02, AC-12).
 * Course first, then classes under it. One trainer per class.
 * Deleting a class warns first when it still has documents/tickets.
 */
export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [trainers, setTrainers] = React.useState<AdminUser[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [courseCode, setCourseCode] = React.useState("");
  const [courseTitle, setCourseTitle] = React.useState("");
  const [classCourseId, setClassCourseId] = React.useState("");
  const [classCode, setClassCode] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<ClassSection | null>(null);

  // NOTE: no synchronous setState here — this runs inside a useEffect,
  // so all state updates happen after the await (async continuation).
  // Event handlers below clear `error` themselves before reloading.
  const load = React.useCallback(async () => {
    try {
      const [c, k, u] = await Promise.all([adminApi.courses(), adminApi.classes(), adminApi.users()]);
      setCourses(c);
      setClasses(k);
      setTrainers(u.filter((x) => x.role === "trainer" && x.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function createCourse(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await adminApi.createCourse(courseCode.trim(), courseTitle.trim());
      setCourseCode("");
      setCourseTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await adminApi.createClass(Number(classCourseId), classCode.trim());
      setClassCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function setTrainer(section: ClassSection, trainerId: string) {
    setError(null);
    try {
      await adminApi.assignStaff(section.id, trainerId ? Number(trainerId) : null, section.ta_id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    try {
      await adminApi.deleteClass(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Courses &amp; classes</h1>
        <p className="text-sm text-muted-foreground">
          Create a course first — a class cannot be assigned to anyone before it exists (AC-01).
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New course</CardTitle>
            <CardDescription>Courses group classes (sections).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCourse} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Code
                <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="SE101" required />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Title
                <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Intro to SE" required />
              </label>
              <Button type="submit">Create course</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New class</CardTitle>
            <CardDescription>A class lives under exactly one course.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createClass} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Course
                <select
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={classCourseId}
                  onChange={(e) => setClassCourseId(e.target.value)}
                  required
                >
                  <option value="">Select a course…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Class code
                <Input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="SE101-A" required />
              </label>
              <Button type="submit" disabled={!classCourseId}>
                Create class
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {classes.length === 0 ? (
        <EmptyState title="No classes yet" description="Create a course, then add its first class above." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Exactly one trainer per class; the same trainer may teach several classes (AC-02).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>TA</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.code}</TableCell>
                    <TableCell>{k.course_code}</TableCell>
                    <TableCell>
                      <select
                        className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs"
                        value={k.trainer_id ?? ""}
                        onChange={(e) => void setTrainer(k, e.target.value)}
                        aria-label={`Trainer for ${k.code}`}
                      >
                        <option value="">Unassigned</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.username} ({t.email})
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>{k.ta_name ?? "—"}</TableCell>
                    <TableCell>{k.student_count}</TableCell>
                    <TableCell>
                      {k.document_count + k.ticket_count > 0 ? (
                        <Badge variant="secondary">
                          {k.document_count} docs · {k.ticket_count} tickets
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => setPendingDelete(k)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete class {pendingDelete?.code}?</DialogTitle>
            <DialogDescription>
              {pendingDelete && (pendingDelete.document_count > 0 || pendingDelete.ticket_count > 0) ? (
                <>
                  Warning: this class still has {pendingDelete.document_count} document(s) and{" "}
                  {pendingDelete.ticket_count} ticket(s). Members will be unlinked from the class but keep
                  their accounts.
                </>
              ) : (
                "Members will be unlinked from the class but keep their accounts."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
