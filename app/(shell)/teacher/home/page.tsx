"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, Users } from "lucide-react";
import { studentApi, type StudentClass } from "@/lib/student-api";
import { peekClasses } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { useProfile } from "@/features/profile/profile-context";
import { PageContainer } from "@/components/shared/PageShell";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";
import { buildActionItems } from "@/features/teacher-home/action-items";

/**
 * Teacher home is the "what needs me" surface, not a second copy of
 * /teacher/classes: that page owns browsing and search, this one only lists join
 * requests that are waiting for the teacher's approval.
 */
function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#6F6F6F]">{label}</dt>
      <dd className="mt-1 font-heading text-[26px] font-bold leading-none tracking-tight text-[#111111]">
        {value === null ? <span className="text-[#CFCFCF]">—</span> : value}
      </dd>
    </div>
  );
}

function StatsCard({ classes, pending }: { classes: number | null; pending: number | null }) {
  return (
    <div className="rounded-xl border border-[#DADADA] bg-white p-5 shadow-sm">
      <dl className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <Stat label="Classes" value={classes} />
        <div aria-hidden className="hidden h-10 w-px bg-[#EDEDED] sm:block" />
        <Stat label="Pending requests" value={pending} />
      </dl>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div aria-hidden className="rounded-xl border border-[#DADADA] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-10">
        {[0, 1].map((i) => (
          <div key={i}>
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="mt-2 h-6 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionListSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-[#DADADA] bg-white shadow-sm">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[#EDEDED] p-5 last:border-b-0">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-[#EDEDED]" />
          <div className="min-w-0 flex-1">
            <SkeletonLine className="h-3.5 w-56" />
            <SkeletonLine className="mt-2 h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeacherHomePage() {
  const { profile } = useProfile();
  const [classes, setClasses] = React.useState<StudentClass[] | null>(null);
  const [pending, setPending] = React.useState<Record<string, number | null> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Seed the class list from the session cache so the header and the class count
  // paint with real numbers on the first frame after a reload (no placeholder swap).
  useIsomorphicLayoutEffect(() => {
    const cached = peekClasses();
    if (cached) setClasses((current) => current ?? cached);
  }, []);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const list = await studentApi.classes();
      setClasses(list);

      const counts = await Promise.all(
        list.map(async (cls) => {
          const count = await studentApi
            .pendingRequests(cls.id)
            .then((rows) => rows.length)
            .catch(() => null);
          return [cls.id, count] as const;
        }),
      );
      setPending(Object.fromEntries(counts));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your workspace");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after awaits.
    void load();
  }, [load]);

  const name = profile?.username?.trim();
  const items = React.useMemo(
    () => (classes && pending ? buildActionItems(classes, pending) : []),
    [classes, pending],
  );
  const pendingTotal = React.useMemo(() => {
    if (!pending) return null;
    return Object.values(pending).reduce<number>((sum, count) => sum + (count ?? 0), 0);
  }, [pending]);

  return (
    <PageContainer className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-heading font-bold text-[#111111] tracking-tight">
            {name ? `Welcome back, ${name}` : "Welcome back"}
          </h1>
          <p className="text-[14px] text-[#5A5A5A] mt-1">Here is what is waiting on you today.</p>
        </div>
        {classes && classes.length > 0 && (
          <Link
            href="/teacher/classes"
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#111111] hover:underline"
          >
            All classes ({classes.length}) <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </header>

      {error ? (
        <div className="rounded-xl border border-[#CFCFCF] bg-white p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button onClick={() => void load()} className="mt-2 font-semibold text-[#111111] hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <>
          {classes === null ? (
            <StatsSkeleton />
          ) : (
            <Reveal>
              <StatsCard classes={classes.length} pending={pendingTotal} />
            </Reveal>
          )}

          <section className="space-y-4">
            <h2 className="text-[17px] font-heading font-bold text-[#111111]">Waiting for your approval</h2>

            {classes === null || pending === null ? (
              <ActionListSkeleton />
            ) : items.length === 0 ? (
              <Reveal>
                <div className="rounded-xl border border-[#DADADA] bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F7F7]">
                    <Check className="h-5 w-5 text-[#111111]" />
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-[#111111]">No join requests waiting</p>
                  <p className="mt-1 text-[13px] text-[#5A5A5A]">
                    Students who ask to join one of your classes show up here for approval.
                  </p>
                  <Link
                    href="/teacher/classes"
                    className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#111111] hover:underline"
                  >
                    Browse your classes <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Reveal>
            ) : (
              <Reveal>
                <ul className="divide-y divide-[#EDEDED] overflow-hidden rounded-xl border border-[#DADADA] bg-white shadow-sm">
                  {items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 p-5 transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111111]/20"
                      >
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F7]"
                        >
                          <Users className="h-4 w-4 text-[#111111]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-semibold text-[#111111]">{item.title}</span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-[#5A5A5A]">
                            {item.detail}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#CFCFCF]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </section>
        </>
      )}
    </PageContainer>
  );
}
