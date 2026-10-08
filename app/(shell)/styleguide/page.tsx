"use client";

import * as React from "react";
import { Inbox, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------- styleguide-only layout helpers (not product components) ---------- */

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{intro}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Demo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-6">
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

/* ---------- page ---------- */

const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "primary",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "destructive",
  "border",
  "input",
  "ring",
] as const;

const RADIUS_TOKENS = [
  { label: "--radius-sm", className: "rounded-sm" },
  { label: "--radius-md", className: "rounded-md" },
  { label: "--radius-lg", className: "rounded-lg" },
  { label: "--radius-xl", className: "rounded-xl" },
] as const;

type DocRow = {
  name: string;
  klass: string;
  status: "indexed" | "processing" | "failed";
  updated: string;
};

const DOC_ROWS: DocRow[] = [
  { name: "week-01-intro.pdf", klass: "AI Fundamentals", status: "indexed", updated: "2 hours ago" },
  { name: "week-02-slides.pptx", klass: "AI Fundamentals", status: "processing", updated: "10 minutes ago" },
  { name: "week-03-lab.docx", klass: "Data Engineering", status: "failed", updated: "Yesterday" },
];

const STATUS_BADGE: Record<DocRow["status"], { variant: "default" | "secondary" | "destructive"; label: string }> = {
  indexed: { variant: "default", label: "Indexed" },
  processing: { variant: "secondary", label: "Processing" },
  failed: { variant: "destructive", label: "Failed" },
};

export default function StyleguidePage() {
  const [selectValue, setSelectValue] = React.useState("student");
  const [formClass, setFormClass] = React.useState("");

  return (
    <div className="pb-16">
      <header>
        <h1 className="text-2xl font-semibold">Styleguide</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Every shared component in one place. Feature pages import from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">@/components/ui</code>{" "}
          and assemble — they never re-implement Button, Input or Table, and never
          hardcode colors. Each section below has a live example and the exact JSX to copy.
        </p>
      </header>

      {/* ---------- tokens ---------- */}
      <Section
        title="Design tokens"
        intro="All colors, fonts and radii live in app/globals.css. Use semantic Tailwind classes (bg-primary, text-muted-foreground) — never raw hex values — so light/dark stay consistent."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="flex items-center gap-2">
              <span
                className="size-8 shrink-0 rounded-md border border-border"
                style={{ background: `var(--${token})` }}
                aria-hidden
              />
              <span className="truncate text-xs text-muted-foreground">
                --{token}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          {RADIUS_TOKENS.map((radius) => (
            <div key={radius.label} className="text-center">
              <div
                className={`size-12 border border-border bg-muted ${radius.className}`}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                {radius.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-sm">
            Sans (Geist) — body copy and UI labels use this face.
          </p>
          <p className="font-mono text-sm">
            Mono (Geist Mono) — code, IDs and measurements.
          </p>
          <p className="text-xs text-muted-foreground">
            Spacing uses the Tailwind default scale (4px base): p-2 / p-4 / p-6 / gap-4.
          </p>
        </div>
      </Section>

      {/* ---------- button ---------- */}
      <Section
        title="Button"
        intro="Every clickable action. Use destructive only for irreversible actions, ghost for low-emphasis actions like toolbar controls, link for inline text actions."
      >
        <Demo>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link button</Button>
        </Demo>
        <Demo>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Upload">
            <Upload className="size-4" />
          </Button>
          <Button disabled>Disabled</Button>
        </Demo>
        <Code>{`import { Button } from "@/components/ui"

<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button size="icon" aria-label="Upload"><Upload className="size-4" /></Button>
<Button disabled>Saving…</Button>`}</Code>
      </Section>

      {/* ---------- input ---------- */}
      <Section
        title="Input"
        intro="Single-line text fields. Always pair with a visible label; mark invalid fields with aria-invalid and show the error message below."
      >
        <div className="grid max-w-xl gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Document name
            <Input placeholder="week-01-intro.pdf" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <Input type="email" aria-invalid placeholder="not-an-email@" />
            <span className="text-xs text-destructive">
              Enter a valid email address.
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Disabled field
            <Input disabled value="Read-only value" readOnly />
          </label>
        </div>
        <Code>{`import { Input } from "@/components/ui"

<label className="flex flex-col gap-1.5 text-sm font-medium">
  Document name
  <Input placeholder="week-01-intro.pdf" />
  <span className="text-xs text-destructive">Required field.</span>
</label>`}</Code>
      </Section>

      {/* ---------- select ---------- */}
      <Section
        title="Select"
        intro="Dropdown for choosing one value from a known list (classes, statuses, roles). For free text use Input."
      >
        <div className="w-64">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Role
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <Code>{`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"

const [role, setRole] = useState("student")

<Select value={role} onValueChange={setRole}>
  <SelectTrigger className="w-full"><SelectValue placeholder="Pick a role" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="student">Student</SelectItem>
    <SelectItem value="trainer">Trainer</SelectItem>
  </SelectContent>
</Select>`}</Code>
      </Section>

      {/* ---------- modal ---------- */}
      <Section
        title="Modal (Dialog)"
        intro="Interrupts only when a decision is needed — confirmations, detail views. Never for ordinary forms; use a page or card instead."
      >
        <Demo>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Delete document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete “week-01-intro.pdf”?</DialogTitle>
                <DialogDescription>
                  The document and its indexed chunks are removed. This cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Demo>
        <Code>{`import { Button } from "@/components/ui"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"

<Dialog>
  <DialogTrigger asChild><Button variant="outline">Delete document</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete “week-01-intro.pdf”?</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}</Code>
      </Section>

      {/* ---------- table ---------- */}
      <Section
        title="Table"
        intro="Tabular data: document lists, ticket inboxes, admin records. Pair the status column with Badge."
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DOC_ROWS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.klass}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[row.status].variant}>
                      {STATUS_BADGE[row.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Code>{`import { Badge } from "@/components/ui"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"

<div className="overflow-x-auto rounded-lg border border-border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Document</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">week-01-intro.pdf</TableCell>
        <TableCell><Badge>Indexed</Badge></TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>`}</Code>
      </Section>

      {/* ---------- card ---------- */}
      <Section
        title="Card"
        intro="Groups one coherent piece of content: a settings block, a stat panel, a form. Never nest a card inside a card."
      >
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Retrieval thresholds</CardTitle>
            <CardDescription>Applies to every new question.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">Reset</Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Similarity cutoff <span className="font-mono text-foreground">0.8</span> ·
            content-gap limits <span className="font-mono text-foreground">3/2/30</span>
          </CardContent>
          <CardFooter>
            <Button size="sm">Save changes</Button>
          </CardFooter>
        </Card>
        <Code>{`import { Button } from "@/components/ui"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui"

<Card className="max-w-md">
  <CardHeader>
    <CardTitle>Retrieval thresholds</CardTitle>
    <CardDescription>Applies to every new question.</CardDescription>
    <CardAction><Button variant="outline" size="sm">Reset</Button></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter><Button size="sm">Save changes</Button></CardFooter>
</Card>`}</Code>
      </Section>

      {/* ---------- badge ---------- */}
      <Section
        title="Badge"
        intro="Short status or category labels — document state, ticket state, role. One or two words; never sentences."
      >
        <Demo>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </Demo>
        <Code>{`import { Badge } from "@/components/ui"

<Badge>Indexed</Badge>
<Badge variant="secondary">Processing</Badge>
<Badge variant="destructive">Failed</Badge>`}</Code>
      </Section>

      {/* ---------- toast ---------- */}
      <Section
        title="Toast"
        intro="Confirms an action already happened. The Toaster is mounted once in AppShell — pages only call toast()."
      >
        <Demo>
          <Button
            variant="outline"
            onClick={() => toast.success("Document uploaded")}
          >
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Upload failed — try again")}
          >
            Error toast
          </Button>
          <Button variant="outline" onClick={() => toast.info("Queue is empty")}>
            Info toast
          </Button>
        </Demo>
        <Code>{`import { toast } from "sonner"

toast.success("Document uploaded")
toast.error("Upload failed — try again")`}</Code>
      </Section>

      {/* ---------- empty state ---------- */}
      <Section
        title="EmptyState"
        intro="Shown whenever a list or table has nothing to render — never a blank panel. Say what is missing and offer the action that fills it."
      >
        <EmptyState
          icon={Inbox}
          title="No tickets yet"
          description="When a student asks a question from chat, the ticket shows up here."
          action={<Button variant="outline" size="sm">Refresh</Button>}
        />
        <Code>{`import { Inbox } from "lucide-react"
import { Button } from "@/components/ui"
import { EmptyState } from "@/components/ui"

<EmptyState
  icon={Inbox}
  title="No tickets yet"
  description="When a student asks a question from chat, the ticket shows up here."
  action={<Button variant="outline" size="sm">Refresh</Button>}
/>`}</Code>
      </Section>

      {/* ---------- form recipe ---------- */}
      <Section
        title="Form recipe"
        intro="The standard shape of a form page: Card wraps the form, labels wrap Input/Select, submit is a Button, success is a toast. Copy this skeleton for any new form."
      >
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Upload course material</CardTitle>
            <CardDescription>PDF, DOCX, PPTX and 6 more formats.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                toast.success("Form submitted");
              }}
            >
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Title
                <Input required placeholder="Week 1 — Introduction" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Class
                <Select value={formClass} onValueChange={setFormClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI Fundamentals</SelectItem>
                    <SelectItem value="de">Data Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <div className="flex gap-2">
                <Button type="submit">Upload</Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Code>{`// app/<route>/page.tsx — assemble, never re-implement
"use client"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { toast } from "sonner"

export default function UploadPage() {
  const [klass, setKlass] = useState("")
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Upload course material</CardTitle>
        <CardDescription>PDF, DOCX, PPTX and 6 more formats.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); toast.success("Form submitted") }}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Title
            <Input required placeholder="Week 1 — Introduction" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Class
            <Select value={klass} onValueChange={setKlass}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pick a class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ai">AI Fundamentals</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="flex gap-2">
            <Button type="submit">Upload</Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}`}</Code>
      </Section>
    </div>
  );
}
