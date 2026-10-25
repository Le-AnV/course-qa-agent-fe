"use client";

import * as React from "react";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type EmailConfig, type EmailEntry, type EmailStats } from "@/lib/admin-api";
import { PageContainer } from "@/components/shared/PageShell";

/**
 * Email sender (AC-08, AC-09, AI-105). App password (Gmail / Workspace),
 * never a personal password, never hardcoded, masked in every response.
 * Queue sends at a limited rate; pending/sent/failed are visible here.
 */
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  sent: "default",
  pending: "secondary",
  failed: "destructive",
};

export default function EmailPage() {
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [stats, setStats] = React.useState<EmailStats | null>(null);
  const [queue, setQueue] = React.useState<EmailEntry[]>([]);
  const [queueFilter, setQueueFilter] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Config form state (app password field is write-only, always blank).
  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  // NOTE: no synchronous setState here — this runs inside a useEffect,
  // so all state updates happen after the await (async continuation).
  // Event handlers below clear `error` themselves before reloading.
  const load = React.useCallback(async () => {
    try {
      const [cfg, st, q] = await Promise.all([
        adminApi.emailConfig(),
        adminApi.emailStats(),
        adminApi.emailQueue(queueFilter || undefined),
      ]);
      setConfig(cfg);
      setStats(st);
      setQueue(q);
      setHost(cfg.smtp_host);
      setPort(String(cfg.smtp_port));
      setSender(cfg.smtp_sender);
      setRate(String(cfg.smtp_rate_per_minute));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, [queueFilter]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await adminApi.updateEmailConfig({
        smtp_host: host,
        smtp_port: Number(port),
        smtp_sender: sender,
        ...(appPassword ? { smtp_app_password: appPassword } : {}),
        smtp_rate_per_minute: Number(rate),
      });
      setAppPassword("");
      setNotice("Email sender saved. App password is stored, never shown.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function processNow() {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const r = await adminApi.processQueue();
      if (r.busy) setError("Another drain is already running — wait a few seconds and retry.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Process failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function retryOne(id: number) {
    setError(null);
    try {
      await adminApi.retryEmail(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    }
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Email sender</h1>
          <p className="text-sm text-muted-foreground">
            Gmail / Workspace app password — every queued email is delivered for real (AC-08).
          </p>
        </div>
        {stats && (
          <div className="flex gap-2">
            <Badge variant="secondary">{stats.pending} pending</Badge>
            <Badge>{stats.sent} sent</Badge>
            {stats.failed > 0 && <Badge variant="destructive">{stats.failed} failed</Badge>}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sender configuration</CardTitle>
            <CardDescription>
              {config?.has_app_password
                ? "An app password is stored (masked). Leave blank to keep it."
                : "No app password stored yet — sending will fail until one is set."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config?.email_dry_run && (
              <p role="status" className="mb-3 text-sm text-destructive">
                Dry-run is still enabled in system config: emails are marked sent without being delivered.
              </p>
            )}
            <form onSubmit={saveConfig} className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium">
                  SMTP host
                  <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Port
                  <Input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Sender address
                <Input type="email" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="noreply@school.edu" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                App password <span className="font-normal text-muted-foreground">(write-only, blank = keep)</span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Max emails / minute
                  <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric" />
                </label>
              </div>
              <Button type="submit">Save sender</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send queue</CardTitle>
            <CardDescription>Deliver every pending email for real, paced at the configured rate (AC-09).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void processNow()} disabled={processing}>
                {processing ? "Sending…" : "Send pending emails"}
              </Button>
              <AppSelect
                value={queueFilter}
                onValueChange={setQueueFilter}
                aria-label="Filter queue by status"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "sent", label: "Sent" },
                  { value: "failed", label: "Failed" },
                ]}
                size="sm"
                triggerClassName="w-auto"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.to_email}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{e.last_error || "—"}</TableCell>
                    <TableCell>
                      {e.status === "failed" && (
                        <Button variant="outline" size="sm" onClick={() => void retryOne(e.id)}>
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
