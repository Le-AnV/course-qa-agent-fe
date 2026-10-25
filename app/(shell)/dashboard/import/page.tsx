"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type ImportBatch, type ImportBatchDetail } from "@/lib/admin-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeader(): HeadersInit {
  return { Authorization: `Bearer ${adminApi.authToken() ?? ""}` };
}

/**
 * Bulk import (AC-05, AC-06, AC-07, AC-10).
 * Template has NO password column; passwords are generated + emailed,
 * and the admin never sees them. Failed rows can be retried individually.
 */
const ROW_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  imported: "default",
  skipped: "secondary",
  failed: "destructive",
};

export default function ImportPage() {
  const [batches, setBatches] = React.useState<ImportBatch[]>([]);
  const [selected, setSelected] = React.useState<ImportBatchDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [retryingId, setRetryingId] = React.useState<number | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // NOTE: no synchronous setState here — this runs inside a useEffect,
  // so the state update happens after the await (async continuation).
  // Event handlers below clear `error` themselves before reloading.
  const load = React.useCallback(async () => {
    try {
      setBatches(await adminApi.imports());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function openDetail(batch: ImportBatch) {
    setError(null);
    try {
      setSelected(await adminApi.importDetail(batch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/admin/imports`, {
        method: "POST",
        headers: authHeader(),
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { detail?: string }).detail ?? "Import failed.");
      }
      if (fileRef.current) fileRef.current.value = "";
      await load();
      await openDetail(body as ImportBatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  async function downloadTemplate() {
    try {
      const blob = await adminApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Template download failed.");
    }
  }

  async function retryRow(rowId: number) {
    setRetryingId(rowId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/import-rows/${rowId}/retry`, {
        method: "POST",
        headers: authHeader(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { detail?: string }).detail ?? "Retry failed.");
      }
      if (selected) await openDetail({ id: selected.id } as ImportBatch);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Bulk import</h1>
        <p className="text-sm text-muted-foreground">
          Columns are exactly: fullname, email, type — MSSV/MSNV are generated from the full name (e.g. TVA_4821). Accounts are created class-less (students request classes, TA approves).
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
            <CardTitle>1. Get the template</CardTitle>
            <CardDescription>Exact expected columns plus one example row (AC-06).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void downloadTemplate()}>
              Download .xlsx template
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Upload a filled file</CardTitle>
            <CardDescription>Each account gets a random password, emailed to its gmail (AC-07).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={upload} className="flex flex-col gap-3">
              <input ref={fileRef} type="file" accept=".xlsx" className="text-sm" aria-label="Import file" />
              <Button type="submit" disabled={uploading}>
                {uploading ? "Importing…" : "Import accounts"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {batches.length === 0 ? (
        <EmptyState title="No imports yet" description="Upload a filled template to onboard a whole class at once." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Import history</CardTitle>
            <CardDescription>Every row is reported: imported, skipped (email exists), or failed (AC-10).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id} className={selected?.id === b.id ? "bg-muted/50" : undefined}>
                    <TableCell className="font-medium">{b.filename}</TableCell>
                    <TableCell>{b.total_rows}</TableCell>
                    <TableCell>{b.imported_count}</TableCell>
                    <TableCell>{b.skipped_count}</TableCell>
                    <TableCell>{b.failed_count}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => void openDetail(b)}>
                        View rows
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {selected && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">{selected.filename} — row report</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Full name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>MSSV / MSNV</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.row_number}</TableCell>
                        <TableCell>{r.username}</TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.role_raw}</TableCell>
                        <TableCell>{(r.student_code || r.staff_code) || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={ROW_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">{r.message}</TableCell>
                        <TableCell>
                          {r.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={retryingId === r.id}
                              onClick={() => void retryRow(r.id)}
                            >
                              {retryingId === r.id ? "Retrying…" : "Retry row"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground">
                  Passwords are generated and emailed per account — they never appear here (AC-07).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
