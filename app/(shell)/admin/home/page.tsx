"use client";

import * as React from "react";
import { AlertTriangle, FileText, Mail } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { adminApi, type EmailStats, type ImportBatch } from "@/lib/admin-api";
import { PageContainer } from "@/components/shared/PageShell";

type Notice = {
  id: string;
  icon: React.ReactNode;
  bg: string;
  title: string;
  detail: string;
  context: string;
  time: string;
  href: string;
  action: string;
  unread: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function AdminHomePage() {
  const [filter, setFilter] = React.useState("All");
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [stats, batches]: [EmailStats, ImportBatch[]] = await Promise.all([
          adminApi.emailStats(),
          adminApi.imports(),
        ]);
        if (cancelled) return;
        const items: Notice[] = [];
        if (stats.pending > 0) {
          items.push({
            id: "email-pending",
            icon: <Mail className="w-4 h-4 text-[#B4881F]" />,
            bg: "bg-[#F7F7F7]",
            title: "Emails waiting in queue",
            detail: `${stats.pending} email(s) pending delivery.`,
            context: `${stats.sent} sent · ${stats.failed} failed`,
            time: "now",
            href: "/admin/email",
            action: "Open email queue",
            unread: true,
          });
        }
        if (stats.failed > 0) {
          items.push({
            id: "email-failed",
            icon: <AlertTriangle className="w-4 h-4 text-[#C4644C]" />,
            bg: "bg-[#F7F7F7]",
            title: "Email delivery failures",
            detail: `${stats.failed} email(s) failed to send.`,
            context: "Review and retry from the queue",
            time: "now",
            href: "/admin/email",
            action: "Review failures",
            unread: true,
          });
        }
        batches.slice(0, 5).forEach((b) => {
          items.push({
            id: `import-${b.id}`,
            icon: <FileText className={`w-4 h-4 ${b.failed_count > 0 ? "text-[#C4644C]" : "text-[#4B9E76]"}`} />,
            bg: "bg-[#F7F7F7]",
            title: "Bulk import finished",
            detail: `${b.imported_count} imported, ${b.failed_count} failed, ${b.skipped_count} skipped.`,
            context: b.filename,
            time: formatDate(b.created_at),
            href: "/admin/history",
            action: "View history",
            unread: b.failed_count > 0,
          });
        });
        setNotices(items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load updates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = notices.filter(
    (n) => !dismissed.has(n.id) && (filter === "All" || n.unread)
  );
  const unreadCount = notices.filter((n) => n.unread && !dismissed.has(n.id)).length;
  const reduceMotion = useReducedMotion();
  const tabTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 38 };

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] font-heading tracking-tight">Home</h1>
          <p className="text-[14px] text-[#5A5A5A] mt-1">System updates and review queue.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DADADA] pb-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFilter("All")}
            className={`relative text-[13px] font-semibold pb-3 -mb-[13px] transition-colors ${
              filter === "All" ? "text-[#111111]" : "text-[#5A5A5A] hover:text-[#111111]"
            }`}
          >
            All
            {filter === "All" && (
              <motion.span
                layoutId="admin-home-tab"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-[#111111]"
                transition={tabTransition}
              />
            )}
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={`relative flex items-center gap-1.5 text-[13px] font-semibold pb-3 -mb-[13px] transition-colors ${
              filter === "Unread" ? "text-[#111111]" : "text-[#5A5A5A] hover:text-[#111111]"
            }`}
          >
            Unread
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-white border border-[#ECDCB8] text-[#8F6B16] text-[10px] font-bold shrink-0">
              {unreadCount}
            </span>
            {filter === "Unread" && (
              <motion.span
                layoutId="admin-home-tab"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-[#111111]"
                transition={tabTransition}
              />
            )}
          </button>
        </div>
        <button
          onClick={() => setDismissed(new Set(notices.map((n) => n.id)))}
          className="text-[12.5px] font-medium text-[#111111] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#DADADA] rounded-lg p-8 text-center text-[#5A5A5A] text-[13px]">
          Loading updates...
        </div>
      ) : error ? (
        <div className="bg-white border border-[#DADADA] rounded-lg p-8 text-center text-[13px]">
          <p className="text-[#C4644C]">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-[#111111] hover:underline">
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-[#DADADA] rounded-lg p-8 text-center text-[#5A5A5A] text-[13px]">
          {filter === "Unread" ? "No unread updates." : "All clear — no pending emails or recent imports."}
        </div>
      ) : (
        <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
          {visible.map((notif, i) => (
            <div key={notif.id} className={`flex items-start gap-4 p-5 transition-colors ${notif.unread ? "bg-[#F7F7F7]/50" : "bg-white"} ${i !== 0 ? 'border-t border-[#DADADA]' : ''}`}>
              <div className={`w-9 h-9 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}>
                {notif.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[#111111]">{notif.title}</h3>
                  {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#B4881F]" />}
                </div>
                <p className="text-[13px] text-[#111111] mt-1">{notif.detail}</p>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-[#5A5A5A]">
                  <span className="font-medium text-[#4D4D4D]">{notif.context}</span>
                  <span>•</span>
                  <span>{notif.time}</span>
                </div>
              </div>

              <div className="shrink-0 pt-1">
                <Link
                  href={notif.href}
                  className="text-[13px] font-semibold text-[#111111] hover:underline whitespace-nowrap"
                >
                  {notif.action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
