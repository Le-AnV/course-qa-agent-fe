import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  LibraryBig,
  MessageSquareText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import { ProductPreview } from "@/features/landing/product-preview";

const workflow = [
  {
    number: "01",
    icon: Upload,
    title: "Add materials to a class",
    description: "Instructors upload the syllabus, lecture notes, and references assigned to that class.",
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Retrieve the right context",
    description: "The system finds the most relevant passages within the selected class and keeps class data isolated.",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "Answer with citations",
    description: "Students get a focused answer and can open the exact document, section, or page behind it.",
  },
];

export default function LandingPage() {
  return (
    <div lang="en" className="min-h-screen bg-white text-slate-950">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <LandingHeader />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-b from-blue-50/80 via-white to-white">
          <div
            className="pointer-events-none absolute left-0 top-0 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/50 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-1/3 size-96 translate-x-1/2 rounded-full bg-cyan-100/60 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-[-8rem] top-48 hidden aspect-[3/2] w-[min(68vw,920px)] bg-contain bg-right-top bg-no-repeat opacity-45 lg:block"
            style={{ backgroundImage: "url('/image/landing-learning-illustration.webp')" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <BookOpenCheck className="size-4" aria-hidden="true" />
                Ask within your class · Verify every answer
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Ask your course materials. Get answers with sources.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Course Q&amp;A Agent helps students find answers in their own syllabus and lecture notes, with citations they can open and verify.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-blue-600 px-6 text-white hover:bg-blue-700">
                  <Link href="/login">
                    Start with your class
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-slate-300 bg-white px-6">
                  <Link href="#how-it-works">See how it works</Link>
                </Button>
              </div>
              <div className="mx-auto mt-8 grid max-w-xl gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                  Uses only class materials
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                  Opens cited sources
                </p>
              </div>
            </div>

            <div className="mt-14">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="border-b border-blue-100 bg-white" aria-label="Answering principles">
          <div className="mx-auto grid max-w-7xl divide-y divide-blue-100 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
            <Principle icon={LibraryBig} title="Class scoped" description="Materials from different classes are never mixed." />
            <Principle icon={ShieldCheck} title="Access controlled" description="Only class members can access its content." />
            <Principle icon={BookOpenCheck} title="Honest about gaps" description="The assistant says when the materials do not contain an answer." />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">How it works</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">From course material to a grounded answer in three steps.</h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">Every question stays within the selected class, keeping the response relevant to the material students are expected to learn.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {workflow.map((item) => (
                <article key={item.number} className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/[0.03] sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">{item.number}</span>
                    <span className="flex size-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace" className="relative scroll-mt-24 overflow-hidden border-y border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 py-20 sm:py-24">
          <div
            className="pointer-events-none absolute -left-32 top-0 size-96 rounded-full bg-blue-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-sky-200/50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">A calmer way to study</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Keep every course question in one clear workspace.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Move from course context to conversation without losing your place. Your history and syllabus stay close while the chat remains the focus.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 bg-blue-600 px-6 text-white hover:bg-blue-700">
                <Link href="/login">
                  Open your workspace
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-950/[0.04] backdrop-blur-sm sm:p-7">
              <p className="text-sm font-semibold text-slate-950">A focused study flow</p>
              <div className="mt-5 divide-y divide-slate-200">
                <StudyStep number="01" title="Choose a course" description="Keep every answer inside the class you are studying." />
                <StudyStep number="02" title="Continue the conversation" description="Return to earlier questions without starting over." />
                <StudyStep number="03" title="Follow the syllabus" description="Keep the most relevant topics visible while you ask." />
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function Principle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex gap-4 py-6 md:px-6 md:first:pl-0 md:last:pr-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function StudyStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">
        {number}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
