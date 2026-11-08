"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  LoaderCircle,
  Search,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  quizApi,
  type QuizStatistics,
  type QuizSubmission,
} from "@/lib/quiz-api";
import { AttemptStatusBadge, OfficialBadge, PassBadge } from "./quiz-result-badges";
import {
  formatDateTime,
  formatPercentage,
  formatScore,
  passRateHint,
  questionTypeLabel,
} from "./quiz-result-format";

/**
 * Teacher results surface (AI-154 AC-04): class statistics, per-question
 * performance and the submissions table, with an Excel export. Only the
 * official attempt of each student feeds the statistics; every submitted
 * attempt is still listed so retakes are visible.
 */
export function QuizResults({ classId, quizId }: { classId: string; quizId: string }) {
  const [submissions, setSubmissions] = React.useState<QuizSubmission[] | null>(null);
  const [statistics, setStatistics] = React.useState<QuizStatistics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [officialOnly, setOfficialOnly] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      quizApi.listSubmissions(classId, quizId),
      quizApi.getStatistics(classId, quizId),
    ])
      .then(([rows, stats]) => {
        if (cancelled) return;
        setSubmissions(rows);
        setStatistics(stats);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load the quiz results.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, quizId, reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  async function exportResults() {
    setExporting(true);
    try {
      await quizApi.exportResults(
        classId,
        quizId,
        statistics?.quiz_title ?? "quiz-results",
      );
      toast.success("Results exported.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not export the results.");
    } finally {
      setExporting(false);
    }
  }

  const rows = submissions ?? [];
  const officialRows = rows.filter((row) => row.official);
  const passed = officialRows.filter((row) => row.is_passed).length;
  const query = search.trim().toLowerCase();
  const visibleRows = rows.filter((row) => {
    if (officialOnly && !row.official) return false;
    if (!query) return true;
    return [row.student_name, row.student_code ?? "", row.student_email].some((value) =>
      value.toLowerCase().includes(query),
    );
  });

  const exportDisabled = exporting || loading || (statistics?.submitted_count ?? 0) === 0;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/teacher/class/${classId}/quizzes/${quizId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Back to quiz
        </Link>
      </div>

      <ClassPageHeader
        title={statistics?.quiz_title ?? "Quiz results"}
        subtitle="Scores, pass rate and question-level performance. Only one official attempt per student is counted."
        badge={
          statistics ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {statistics.submitted_count} official attempt
              {statistics.submitted_count === 1 ? "" : "s"}
            </span>
          ) : undefined
        }
        actions={
          <Button onClick={() => void exportResults()} disabled={exportDisabled}>
            {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <ResultsSkeleton />
      ) : error && !statistics ? null : statistics && statistics.submitted_count === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No submissions yet"
              description="Student scores will appear here after they submit this quiz."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href={`/teacher/class/${classId}/quizzes/${quizId}`}>
                    Back to quiz
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : statistics ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Users}
              label="Students submitted"
              value={String(statistics.submitted_count)}
              hint={`${rows.length} submitted attempt${rows.length === 1 ? "" : "s"} in total`}
            />
            <SummaryCard
              icon={BarChart3}
              label="Average score"
              value={formatScore(statistics.average_score)}
              hint={`out of ${formatScore(statistics.max_score)} points`}
            />
            <SummaryCard
              icon={Target}
              label="Average percentage"
              value={formatPercentage(statistics.average_percentage)}
              hint="Across official attempts"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Pass rate"
              value={formatPercentage(statistics.pass_rate)}
              hint={`${passRateHint(passed, officialRows.length)} · Passing ${formatPercentage(statistics.passing_percentage)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Score distribution</CardTitle>
                <CardDescription>
                  Official attempt percentage grouped into fixed bands.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {statistics.score_bands.map((band) => {
                  const share =
                    statistics.submitted_count > 0
                      ? Math.round((band.count / statistics.submitted_count) * 100)
                      : 0;
                  return (
                    <div
                      key={band.band}
                      className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">{band.band}%</span>
                      <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                        <div
                          className="h-2 rounded-full bg-[#365F85] transition-[width]"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-medium">{band.count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question performance</CardTitle>
                <CardDescription>
                  Answered count and full-correct rate across official attempts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Answered</TableHead>
                      <TableHead className="text-right">Avg score</TableHead>
                      <TableHead className="text-right">Full correct</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.per_question.map((question) => (
                      <TableRow key={question.question_id}>
                        <TableCell className="text-muted-foreground">
                          {question.order_index + 1}
                        </TableCell>
                        <TableCell className="min-w-[260px] whitespace-normal font-medium">
                          {question.question}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {questionTypeLabel(question.question_type)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatScore(question.points)}
                        </TableCell>
                        <TableCell className="text-right">
                          {question.answered_count}/{statistics.submitted_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatScore(question.average_score)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-14 rounded bg-muted" aria-hidden="true">
                              <div
                                className="h-1.5 rounded bg-[#365F85]"
                                style={{ width: `${Math.min(question.full_correct_rate, 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right">
                              {formatPercentage(question.full_correct_rate)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>
                Every submitted attempt, including retakes. The official attempt is the one
                counted for the class statistics.
              </CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, code or email"
                    className="pl-8"
                    aria-label="Search submissions"
                  />
                </div>
                <Button
                  size="sm"
                  variant={officialOnly ? "secondary" : "outline"}
                  onClick={() => setOfficialOnly((value) => !value)}
                  aria-pressed={officialOnly}
                >
                  <CheckCircle2 /> Official only
                </Button>
                {(query || officialOnly) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setOfficialOnly(false);
                    }}
                  >
                    Clear
                  </Button>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Showing {visibleRows.length} of {rows.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {visibleRows.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No matching submissions"
                  description="Try a different name, code or email, or clear the filters."
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setOfficialOnly(false);
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Attempt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((row) => (
                      <TableRow key={row.attempt_id}>
                        <TableCell>
                          <p className="font-medium">
                            {row.student_name || "Unknown student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[row.student_code, row.student_email]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>{formatDateTime(row.submitted_at)}</div>
                          <AttemptStatusBadge status={row.status} className="mt-1" />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatScore(row.total_score)}
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            / {formatScore(row.max_score)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(row.percentage)}
                        </TableCell>
                        <TableCell>
                          <PassBadge isPassed={row.is_passed} />
                        </TableCell>
                        <TableCell>
                          {row.official ? (
                            <OfficialBadge />
                          ) : (
                            <span className="text-xs text-muted-foreground">Retake</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
