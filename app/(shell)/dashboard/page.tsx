"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Inbox, Mail, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/admin-api";

/**
 * Admin dashboard (AI-31): entry point for courses, classes, accounts,
 * bulk import and the email sender. Shows live queue counts (AC-09).
 */
export default function DashboardPage() {
  const [stats, setStats] = React.useState<{ pending: number; sent: number; failed: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    adminApi.emailStats().then(setStats).catch((err: Error) => setError(err.message));
  }, []);

  const cards = [
    {
      href: "/dashboard/courses",
      icon: BookOpen,
      title: "Courses & classes",
      description: "Create a course first, then classes under it. Assign one trainer per class (AC-01, AC-02).",
    },
    {
      href: "/dashboard/accounts",
      icon: Users,
      title: "Accounts",
      description: "Create student / trainer / teaching-assistant accounts. Deactivate, reset, delete (AC-03, AC-11, AC-12).",
    },
    {
      href: "/dashboard/import",
      icon: Inbox,
      title: "Bulk import",
      description: "Download the .xlsx template, import a whole class, review per-row results (AC-05, AC-06, AC-10).",
    },
    {
      href: "/dashboard/email",
      icon: Mail,
      title: "Email sender",
      description: "Gmail app-password config, queue status, retries. Never a personal password (AC-08, AC-09).",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Set up courses and classes, onboard accounts, and watch credential emails go out.
          </p>
        </div>
        {stats && (
          <Card size="sm">
            <CardContent className="flex items-center gap-4 py-3">
              <span className="flex items-center gap-1.5 text-sm">
                <School className="size-4 text-muted-foreground" />
                {stats.pending} pending
              </span>
              <span className="text-sm text-muted-foreground">{stats.sent} sent</span>
              <span className="text-sm text-muted-foreground">{stats.failed} failed</span>
            </CardContent>
          </Card>
        )}
      </div>
      {error && <p className="text-sm text-destructive">Could not load email stats: {error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <card.icon className="size-4 text-muted-foreground" />
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={card.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
