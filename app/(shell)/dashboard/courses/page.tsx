"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageShell";
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
import { AppSelect } from "@/components/ui/app-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type AdminUser, type ClassSection } from "@/lib/admin-api";

/**
 * Classes (each class IS the subject — no course binding).
 * One trainer per class (AC-02). Credits are entered manually (1-6) and
 * capped at 20 per student per semester at enrollment time.
 * Deleting a class warns first when it still has documents/tickets (AC-12).
 */
export default function CoursesPage() {
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [trainers, setTrainers] = React.useState<AdminUser[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [classCode, setClassCode] = React.useState("");
  const [className, setClassName] = React.useState("");
  const [classTrainerId, setClassTrainerId] = React.useState("");
  const [classCredits, setClassCredits] = React.useState("3");
  const [classSemester, setClassSemester] = React.useState("Fall");
  const [classYear, setClassYear] = React.useState("2026");
  const [pendingDelete, setPendingDelete] = React.useState<ClassSection | null>(null);

  // NOTE: no synchronous setState here — this runs inside a useEffect,
  // so all state updates happen after the await (async continuation).
  // Event handlers below clear `error` themselves before reloading.
  const load = React.useCallback(async () => {
    try {
      const [k, u] = await Promise.all([adminApi.classes(), adminApi.users()]);
      setClasses(k);
      const activeTrainers = u.filter((x) => x.role === "trainer" && x.is_active);
      setTrainers(activeTrainers);
      setClassTrainerId((prev) => prev || activeTrainers[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (!classTrainerId) {
        setError("Create a trainer account first — a class requires a trainer.");
        return;
      }
      await adminApi.createClass({
        code: classCode.trim(),
        trainer_id: classTrainerId,
        name: className.trim() || undefined,
        semester: classSemester.trim() || undefined,
        academic_year: classYear.trim() || undefined,
        credits: Number(classCredits) || undefined,
      });
      setClassCode("");
      setClassName("");
      setClassCredits("3");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function setTrainer(section: ClassSection, trainerId: string) {
    setError(null);
    try {
      await adminApi.assignStaff(section.id, trainerId ? trainerId : null);
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
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Each class is a subject — create it directly with a trainer and manual credits (AC-01, AC-02).
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New class</CardTitle>
          <CardDescription>A class requires exactly one trainer. Credits are manual (1-6).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createClass} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Class code
              <Input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="SE101-A" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Class name
              <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Intro to SE - Section 1" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Trainer
              <AppSelect
                value={classTrainerId}
                onValueChange={setClassTrainerId}
                aria-label="Trainer"
                options={[
                  { value: "", label: "Select a trainer." },
                  ...trainers.map((t) => ({
                    value: t.id,
                    label: t.username,
                    description: t.email,
                    initials: t.username.trim().slice(0, 2).toUpperCase(),
                  })),
                ]}
                contentClassName="min-w-[280px]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Credits (1-6)
              <Input
                type="number"
                min={1}
                max={6}
                value={classCredits}
                onChange={(e) => setClassCredits(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Semester
              <Input value={classSemester} onChange={(e) => setClassSemester(e.target.value)} placeholder="Fall" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Academic year
              <Input value={classYear} onChange={(e) => setClassYear(e.target.value)} placeholder="2026" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!classTrainerId}>
                Create class
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {classes.length === 0 ? (
        <EmptyState title="No classes yet" description="Create the first class above." />
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
                  <TableHead>Trainer</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.code}</TableCell>
                    <TableCell>
                      <AppSelect
                        value={k.trainer_id ?? ""}
                        onValueChange={(value) => void setTrainer(k, value)}
                        aria-label={`Trainer for ${k.code}`}
                        options={[
                          { value: "", label: "Unassigned" },
                          ...trainers.map((t) => ({
                            value: t.id,
                            label: t.username,
                            description: t.email,
                            initials: t.username.trim().slice(0, 2).toUpperCase(),
                          })),
                        ]}
                        size="xs"
                        triggerClassName="max-w-[190px]"
                        contentClassName="min-w-[260px]"
                      />
                    </TableCell>
                    <TableCell>{k.credits}</TableCell>
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
    </PageContainer>
  );
}
