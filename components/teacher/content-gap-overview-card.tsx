"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { contentGapApi } from "@/lib/content-gap-api";
import { AppSelect, type AppSelectOption } from "@/components/ui/app-select";

// --- TYPES ---

export type PriorityLevel = "High" | "Medium" | "Low" | "Info";
export type IssueStatus = "Needs Review" | "Missing Material" | "Covered" | "Resolved" | "Optional" | "Enrichment";

export interface ContentIssueRecord {
  id: string;
  issue: string;
  topic: string;
  priority: PriorityLevel;
  priorityReason: string;
  totalQuestions: number;
  webQuestions: number;
  suggestedAction: string;
  status: IssueStatus;
  timeframe: "30d" | "7d" | "90d" | "semester";
  course: string;
  materialSet: "all" | "lecture" | "lab" | "policies";
}

const TIME_OPTIONS: AppSelectOption[] = [
  { value: "30d", label: "Last 30 Days" },
  { value: "7d", label: "Last 7 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "semester", label: "Full Semester" },
];

const MATERIAL_OPTIONS: AppSelectOption[] = [
  { value: "all", label: "All Material Sets" },
  { value: "lecture", label: "Lecture Notes & Materials" },
  { value: "lab", label: "Lab Guides & Exercises" },
  { value: "policies", label: "Syllabus & Policies" },
];

const SOURCE_OPTIONS: AppSelectOption[] = [
  { value: "all", label: "All Answers" },
  { value: "web", label: "Used Web Search" },
];

const PRIORITY_OPTIONS: AppSelectOption[] = [
  { value: "all", label: "All Priorities" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "Info", label: "Info" },
];

interface ContentGapOverviewCardProps {
  classId?: string;
  courseName?: string;
  courseCode?: string;
}

export function ContentGapOverviewCard({
  classId,
  courseName,
  courseCode,
}: ContentGapOverviewCardProps) {
  const currentCourseName = courseName || "Course Curriculum & Learning Materials";

  // --- LIVE BACKEND DATA STATE ---
  const [issuesData, setIssuesData] = React.useState<ContentIssueRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [, setLoadError] = React.useState<string | null>(null);

  // --- A. GLOBAL HEADER FILTERS ---
  const [timeRange, setTimeRange] = React.useState<"30d" | "7d" | "90d" | "semester">("30d");
  const [selectedMaterialSet, setSelectedMaterialSet] = React.useState<"all" | "lecture" | "lab" | "policies">("all");

  // --- INTERACTION STATE (Chart click filters table) ---
  const [chartSelectedTopic, setChartSelectedTopic] = React.useState<string | null>(null);
  const [chartSelectedNeed, setChartSelectedNeed] = React.useState<string | null>(null);

  // --- C. TABLE TOOLBAR FILTERS ---
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [tableTopicFilter, setTableTopicFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<"all" | "web">("all");
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | PriorityLevel>("all");

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const PAGE_SIZE = 10;

  // --- FETCH REAL DATA FROM BACKEND ---
  const fetchLiveGaps = React.useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await contentGapApi.getContentGaps(classId);
      const records: ContentIssueRecord[] = [];

      res.topics.forEach((topic) => {
        // 1. Concrete Question Patterns synthesized from student queries
        if (topic.student_weakness?.question_patterns && topic.student_weakness.question_patterns.length > 0) {
          topic.student_weakness.question_patterns.forEach((pat, idx) => {
            const total = pat.total_inquiry_count ?? pat.inquiry_count;
            const web = pat.inquiry_count;
            const ratio = total > 0 ? web / total : 0;
            const enrichmentRegex = /(?:ngôn ngữ khác|ngôn ngữ lập trình khác|ngoài đề cương|ngoài giáo trình|vulkan|opengl|directx|unreal|game engine|thư viện đồ họa|python|java|c#|rust|golang)/i;
            const isEnrichment = pat.scope_type === "enrichment" ||
              enrichmentRegex.test(pat.pattern) ||
              (Boolean(pat.sample_question) && enrichmentRegex.test(pat.sample_question || ""));

            let status: IssueStatus;
            let priority: PriorityLevel;

            if (isEnrichment) {
              status = "Optional";
              priority = "Info";
            } else if (web === 0) {
              status = "Covered";
              priority = "Low";
            } else if ((ratio >= 0.3 && web >= 2) || ratio >= 0.5) {
              status = "Missing Material";
              priority = web >= 10 ? "High" : "Medium";
            } else {
              status = "Needs Review";
              priority = web >= 10 ? "High" : web >= 4 ? "Medium" : "Low";
            }

            records.push({
              id: `real-${topic.category_id}-pat-${idx}`,
              issue: pat.pattern,
              topic: topic.category_name,
              priority: priority,
              priorityReason: isEnrichment
                ? "Nhu cầu tự tìm hiểu thêm của sinh viên ngoài đề cương bài học (Optional inquiry)."
                : (pat.sample_question
                  ? `Student query: "${pat.sample_question}" (${web} web fallback(s) out of ${total} total inquiries)`
                  : `${web} web fallback(s) out of ${total} total inquiries across ${pat.student_count} student(s).`),
              totalQuestions: total,
              webQuestions: web,
              suggestedAction:
                pat.suggested_action ||
                (isEnrichment
                  ? "Nhu cầu tự tìm hiểu thêm của sinh viên ngoài đề cương; thầy/cô có thể tạo bài đọc thêm tự chọn (Optional Reading) hoặc gợi ý đề tài nếu muốn."
                  : (topic.curriculum_gap?.recommendation || "Review and supplement lecture and lab materials for this concept.")),
              status: status,
              timeframe: "30d",
              course: currentCourseName,
              materialSet: "lecture",
            });
          });
        } else if (topic.reason_groups && topic.reason_groups.length > 0) {
          // 2. Reason Groups fallback
          topic.reason_groups.forEach((rg, idx) => {
            const total = topic.total_queries;
            const web = rg.question_count;
            const ratio = total > 0 ? web / total : 0;
            const sampleQ = rg.questions && rg.questions.length > 0 ? rg.questions[0].question : "";
            const enrichmentRegex = /(?:ngôn ngữ khác|ngôn ngữ lập trình khác|ngoài đề cương|ngoài giáo trình|vulkan|opengl|directx|unreal|game engine|thư viện đồ họa|python|java|c#|rust|golang)/i;
            const isEnrichment = enrichmentRegex.test(rg.title) || (Boolean(sampleQ) && enrichmentRegex.test(sampleQ));

            let status: IssueStatus;
            let priority: PriorityLevel;

            if (isEnrichment) {
              status = "Optional";
              priority = "Info";
            } else if (web === 0) {
              status = "Covered";
              priority = "Low";
            } else if ((ratio >= 0.3 && web >= 2) || ratio >= 0.5) {
              status = "Missing Material";
              priority = web >= 10 ? "High" : "Medium";
            } else {
              status = "Needs Review";
              priority = web >= 10 ? "High" : web >= 4 ? "Medium" : "Low";
            }

            records.push({
              id: `real-${topic.category_id}-rg-${idx}`,
              issue: rg.title,
              topic: topic.category_name,
              priority: priority,
              priorityReason: isEnrichment
                ? "Nhu cầu tự tìm hiểu thêm của sinh viên ngoài đề cương bài học (Optional inquiry)."
                : (rg.explanation || (sampleQ ? `Recent query: "${sampleQ}"` : `Topic health: ${topic.status}`)),
              totalQuestions: total,
              webQuestions: web,
              suggestedAction: isEnrichment
                ? "Nhu cầu tự tìm hiểu thêm của sinh viên ngoài đề cương; thầy/cô có thể tạo bài đọc thêm tự chọn (Optional Reading) hoặc gợi ý đề tài nếu muốn."
                : (topic.curriculum_gap?.recommendation || "Review and expand course materials for this section."),
              status: status,
              timeframe: "30d",
              course: currentCourseName,
              materialSet: "lecture",
            });
          });
        } else if (topic.material_answers > 0 && topic.web_fallbacks === 0) {
          // 3. Topics with healthy internal material coverage (0 web fallbacks) without sub-patterns
          records.push({
            id: `real-${topic.category_id}-covered`,
            issue: "Core concepts covered by internal materials",
            topic: topic.category_name,
            priority: "Low",
            priorityReason: "0% web search; student inquiries answered directly from internal materials.",
            totalQuestions: topic.material_answers,
            webQuestions: 0,
            suggestedAction: "Material coverage is healthy; maintain existing lecture notes.",
            status: "Covered",
            timeframe: "30d",
            course: currentCourseName,
            materialSet: "lecture",
          });
        }
      });

      setIssuesData(records);
    } catch (err) {
      console.error("[ContentGap] Failed to fetch real data:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load real data");
    } finally {
      setIsLoading(false);
    }
  }, [classId, currentCourseName]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void fetchLiveGaps();
  }, [fetchLiveGaps]);

  // Reset granular chart/table selections whenever navigating to a different class
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- class navigation reset
    setChartSelectedTopic(null);
    setChartSelectedNeed(null);
    setTableTopicFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  }, [classId]);

  // --- BASE DATASET (filtered by Global Header Filters only) ---
  const baseData = React.useMemo(() => {
    return issuesData.filter((item) => {
      if (selectedMaterialSet !== "all" && item.materialSet !== selectedMaterialSet) return false;
      return true;
    });
  }, [issuesData, selectedMaterialSet]);

  // --- B. TOP CONTENT ISSUES GROUPED BAR CHART (Adaptive Y-ticks & Responsive Bar Width) ---
  const chartIssuesData = React.useMemo(() => {
    // Pick top 5 issues from baseData sorted by total questions
    const sorted = [...baseData]
      .sort((a, b) => b.totalQuestions - a.totalQuestions)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        issue: item.issue,
        topic: item.topic,
        total: item.totalQuestions,
        webCount: item.webQuestions,
        internalCount: Math.max(0, item.totalQuestions - item.webQuestions),
      }));

    const maxRaw = sorted.length > 0 ? Math.max(...sorted.map((t) => Math.max(t.internalCount, t.webCount, t.total))) : 4;

    // Adaptive clean step size and yMax
    let step = 5;
    let yMax = 15;

    if (maxRaw <= 4) {
      step = 1;
      yMax = Math.max(4, maxRaw + 1);
    } else if (maxRaw <= 8) {
      step = 2;
      yMax = Math.max(6, Math.ceil(maxRaw / 2) * 2);
    } else if (maxRaw <= 20) {
      step = 5;
      yMax = Math.max(10, Math.ceil(maxRaw / 5) * 5);
    } else if (maxRaw <= 50) {
      step = 10;
      yMax = Math.ceil(maxRaw / 10) * 10;
    } else {
      step = 20;
      yMax = Math.ceil(maxRaw / 20) * 20;
    }

    const yTicks: number[] = [];
    for (let val = yMax; val >= 0; val -= step) {
      yTicks.push(val);
    }

    return { top5: sorted, totalCount: baseData.length, yMax, yTicks };
  }, [baseData]);



  // --- FILTERED TABLE DATA ---
  const filteredTableData = React.useMemo(() => {
    return baseData.filter((item) => {
      if (chartSelectedTopic && item.topic !== chartSelectedTopic) return false;
      if (chartSelectedNeed && item.issue !== chartSelectedNeed) return false;
      if (tableTopicFilter !== "all" && item.topic !== tableTopicFilter) return false;
      if (sourceFilter === "web" && item.webQuestions === 0) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchIssue = item.issue.toLowerCase().includes(query);
        const matchTopic = item.topic.toLowerCase().includes(query);
        const matchAction = item.suggestedAction.toLowerCase().includes(query);
        if (!matchIssue && !matchTopic && !matchAction) return false;
      }

      return true;
    });
  }, [
    baseData,
    chartSelectedTopic,
    chartSelectedNeed,
    tableTopicFilter,
    sourceFilter,
    priorityFilter,
    searchQuery,
  ]);

  // Reset page to 1 whenever filters change
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- filter change pagination reset
    setCurrentPage(1);
  }, [
    chartSelectedTopic,
    chartSelectedNeed,
    tableTopicFilter,
    sourceFilter,
    priorityFilter,
    searchQuery,
    selectedMaterialSet,
  ]);

  // Pagination slice
  const totalItems = filteredTableData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTableData.slice(start, start + PAGE_SIZE);
  }, [filteredTableData, currentPage]);

  const clearAllTableFilters = () => {
    setChartSelectedTopic(null);
    setChartSelectedNeed(null);
    setSearchQuery("");
    setTableTopicFilter("all");
    setSourceFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveTableFilters =
    Boolean(chartSelectedTopic) ||
    Boolean(chartSelectedNeed) ||
    searchQuery.trim() !== "" ||
    tableTopicFilter !== "all" ||
    sourceFilter !== "all" ||
    priorityFilter !== "all";

  // Priority badge styling (clean, modern pill)
  const renderPriorityBadge = (priority: PriorityLevel, reason: string) => {
    let bg = "bg-slate-50 text-slate-600 border-slate-200";
    if (priority === "High") bg = "bg-rose-50 text-rose-700 border-rose-200/80";
    if (priority === "Medium") bg = "bg-amber-50 text-amber-700 border-amber-200/80";
    if (priority === "Info") bg = "bg-blue-50 text-blue-700 border-blue-200/80";

    return (
      <span
        title={reason}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${bg}`}
      >
        {priority}
      </span>
    );
  };

  // All unique topics for the dropdown (strictly scoped to this course)
  const uniqueTopics = React.useMemo(() => {
    const set = new Set<string>();
    issuesData.forEach((i) => set.add(i.topic));
    return Array.from(set);
  }, [issuesData]);

  const topicOptions: AppSelectOption[] = React.useMemo(
    () => [
      { value: "all", label: "All Topics" },
      ...uniqueTopics.map((t) => ({ value: t, label: t })),
    ],
    [uniqueTopics],
  );

  // Loading skeleton
  if (isLoading && issuesData.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xs animate-pulse space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse" />
          <div className="h-64 rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse" />
        </div>
        <div className="h-80 rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-[#111827]">
      {/* ========================================================================= */}
      {/* A. HEADER & GLOBAL FILTERS                                                */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Content Gap</h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Explore student learning needs and materials to review or add.
            </p>
          </div>

          {/* Global Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scoped Course Context Badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[12px]">
              <span className="text-[#64748B] text-[11.5px] font-medium">Course:</span>
              <span className="font-semibold text-[#0F172A]">{currentCourseName}</span>
              {courseCode && <span className="text-[11px] font-normal text-[#64748B]">({courseCode})</span>}
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Time:</span>
              <AppSelect
                size="sm"
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as "30d" | "7d" | "90d" | "semester")}
                options={TIME_OPTIONS}
                aria-label="Time range"
                triggerClassName="w-[140px]"
              />
            </div>

            {/* Material Set */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Materials:</span>
              <AppSelect
                size="sm"
                value={selectedMaterialSet}
                onValueChange={(v) => setSelectedMaterialSet(v as "all" | "lecture" | "lab" | "policies")}
                options={MATERIAL_OPTIONS}
                aria-label="Material set"
                triggerClassName="w-[200px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* B. TWO CHARTS (Side-by-side on desktop, stacked on mobile, equal height)  */}
      {/* ========================================================================= */}
      <div className="w-full">
        {/* --- VERTICAL GROUPED BAR CHART: TONE XANH & RO RANG X/Y AXIS --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Card Header with Title and Legend */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Content Issues Inquiries</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Top issues from table &bull; Course materials vs Web assisted inquiries
              </p>
            </div>
            {/* Legend (Tone Xanh) */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3.5 h-3.5 rounded-xs bg-blue-200 border border-blue-300" />
                Course Materials (No web search)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3.5 h-3.5 rounded-xs bg-blue-600" />
                Web Assisted (Web search)
              </span>
            </div>
          </div>

          {/* Chart Canvas Area */}
          <div className="p-6">
            {chartIssuesData.top5.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No issues recorded in the table for this scope.
              </div>
            ) : (
              (() => {
                const itemCount = chartIssuesData.top5.length;
                const containerAlignClass = itemCount <= 2
                  ? "justify-start gap-12 sm:gap-20 pl-6 sm:pl-12"
                  : "justify-around px-3 sm:px-6";
                const itemMaxWClass = itemCount === 1 ? "max-w-[200px]" : itemCount === 2 ? "max-w-[160px]" : "max-w-[120px]";
                const barWClass = itemCount === 1 ? "w-10 sm:w-12" : itemCount === 2 ? "w-8 sm:w-10" : "w-5 sm:w-7";
                const labelMaxWClass = itemCount === 1
                  ? "max-w-[180px] sm:max-w-[220px]"
                  : itemCount === 2
                    ? "max-w-[140px] sm:max-w-[160px]"
                    : "max-w-[110px] sm:max-w-[125px]";

                return (
                  <div className="pt-2">
                    {/* Y-Axis Label */}
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-12 flex items-center justify-between pr-4">
                      <span>Questions</span>
                      {itemCount === 1 && (
                        <span className="text-[11px] font-normal text-slate-400 italic">
                          Lớp đang có 1 vấn đề được ghi nhận
                        </span>
                      )}
                    </div>

                    {/* Chart Frame with Y-Axis & Plot Area */}
                    <div className="flex">
                      {/* Y-Axis Tick Numbers */}
                      <div className="w-12 shrink-0 flex flex-col justify-between items-end pr-2.5 h-[240px] select-none py-0">
                        {chartIssuesData.yTicks.map((tick) => (
                          <span key={tick} className="text-xs font-semibold text-slate-500 tabular-nums leading-none">
                            {tick}
                          </span>
                        ))}
                      </div>

                      {/* Plot Area with Clear Solid Y-axis (border-l-2) and X-axis (border-b-2) */}
                      <div className="relative flex-1 h-[240px] border-l-2 border-b-2 border-slate-400">
                        {/* Horizontal Gridlines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          {chartIssuesData.yTicks.map((tick, idx) => (
                            <div
                              key={idx}
                              className={`w-full ${idx === chartIssuesData.yTicks.length - 1 ? "" : "border-b border-slate-100"}`}
                            />
                          ))}
                        </div>

                        {/* Bars Container with Adaptive Alignment & Width */}
                        <div className={`relative h-full flex items-end ${containerAlignClass} z-10`}>
                          {chartIssuesData.top5.map((item) => {
                            const isSelected = chartSelectedNeed === item.issue;
                            const internalPct = item.internalCount === 0
                              ? 0
                              : Math.max(6, Math.round((item.internalCount / chartIssuesData.yMax) * 100));
                            const webPct = item.webCount === 0
                              ? 0
                              : Math.max(6, Math.round((item.webCount / chartIssuesData.yMax) * 100));

                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  if (chartSelectedNeed === item.issue) {
                                    setChartSelectedNeed(null);
                                  } else {
                                    setChartSelectedNeed(item.issue);
                                  }
                                }}
                                className={`h-full flex-1 ${itemMaxWClass} flex items-end justify-center gap-2 sm:gap-3 group cursor-pointer`}
                                title={`${item.issue} (${item.topic}): ${item.total.toLocaleString()} total inquiries (${item.internalCount.toLocaleString()} course materials, ${item.webCount.toLocaleString()} web assisted). Click to filter table.`}
                              >
                                {/* Bar 1: Course Materials (Light Blue) */}
                                <div className="h-full flex flex-col justify-end items-center relative">
                                  <span className="text-[11px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap">
                                    {item.internalCount}
                                  </span>
                                  <div
                                    style={{ height: `${internalPct}%` }}
                                    className={`${barWClass} rounded-t-sm transition-all duration-300 ${
                                      item.internalCount === 0
                                        ? "h-0.5 bg-blue-300/40"
                                        : `bg-blue-200 border border-blue-300 group-hover:bg-blue-300 shadow-2xs ${
                                            isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""
                                          }`
                                    }`}
                                  />
                                </div>

                                {/* Bar 2: Web Assisted (Deep Blue) */}
                                <div className="h-full flex flex-col justify-end items-center relative">
                                  <span className="text-[11px] font-bold text-blue-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap">
                                    {item.webCount}
                                  </span>
                                  <div
                                    style={{ height: `${webPct}%` }}
                                    className={`${barWClass} rounded-t-sm transition-all duration-300 ${
                                      item.webCount === 0
                                        ? "h-0.5 bg-blue-600/30"
                                        : `bg-blue-600 group-hover:bg-blue-700 shadow-xs ${
                                            isSelected ? "ring-2 ring-blue-700 ring-offset-1" : ""
                                          }`
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* X-Axis Labels Row */}
                    <div className="flex mt-2.5">
                      {/* Spacer matching Y-axis width */}
                      <div className="w-12 shrink-0" />

                      {/* Labels underneath the solid X-axis */}
                      <div className={`flex-1 flex ${containerAlignClass}`}>
                        {chartIssuesData.top5.map((item) => {
                          const isSelected = chartSelectedNeed === item.issue;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (chartSelectedNeed === item.issue) {
                                  setChartSelectedNeed(null);
                                } else {
                                  setChartSelectedNeed(item.issue);
                                }
                              }}
                              className={`flex-1 ${itemMaxWClass} text-center cursor-pointer group px-1`}
                              title={item.issue}
                            >
                              <p
                                className={`text-xs font-semibold truncate transition-colors ${labelMaxWClass} mx-auto ${
                                  isSelected ? "text-blue-700 font-bold" : "text-slate-700 group-hover:text-blue-600"
                                }`}
                              >
                                {item.issue}
                              </p>
                              <p className={`text-[10px] text-slate-400 truncate mt-0.5 ${labelMaxWClass} mx-auto`} title={item.topic}>
                                {item.topic}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Card Footer */}
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span>Showing top {chartIssuesData.top5.length} of {chartIssuesData.totalCount} table items</span>
              {chartSelectedNeed && (
                <button
                  type="button"
                  onClick={() => setChartSelectedNeed(null)}
                  className="text-blue-600 hover:text-blue-700 font-medium ml-2 underline"
                >
                  Clear filter ({chartSelectedNeed})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* C. UNIFIED DETAIL TABLE (Single Source of Truth)                          */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        {/* Table Header & Title */}
        <div className="border-b border-[#F1F5F9] p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold text-[#0F172A]">Content Issues & Learning Needs</h2>
              <p className="text-[12.5px] text-[#64748B]">
                Granular view of student inquiries, web fallbacks, and curriculum recommendations.
              </p>
            </div>
            <div className="text-[12px] text-[#64748B] font-medium">
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems} issues
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search issues, topics, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] bg-white py-1.5 pl-8 pr-3 text-[12.5px] text-[#111827] placeholder-[#9CA3AF] focus:border-[#2563EB] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Topic Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Topic:</span>
              <AppSelect
                size="sm"
                value={tableTopicFilter}
                onValueChange={(v) => setTableTopicFilter(v)}
                options={topicOptions}
                aria-label="Topic filter"
                triggerClassName="w-[170px]"
              />
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Source:</span>
              <AppSelect
                size="sm"
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v as "all" | "web")}
                options={SOURCE_OPTIONS}
                aria-label="Source filter"
                triggerClassName="w-[150px]"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Priority:</span>
              <AppSelect
                size="sm"
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as "all" | PriorityLevel)}
                options={PRIORITY_OPTIONS}
                aria-label="Priority filter"
                triggerClassName="w-[150px]"
              />
            </div>

            {/* Reset Button */}
            {hasActiveTableFilters && (
              <button
                type="button"
                onClick={clearAllTableFilters}
                className="flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1.5 text-[11.5px] font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <RotateCcw className="h-3 w-3" />
                Clear table filters
              </button>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveTableFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
              <span className="text-[11px] font-medium text-[#9CA3AF]">Active filters:</span>

              {chartSelectedTopic && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8] border border-[#BFDBFE]">
                  <span>Topic: {chartSelectedTopic}</span>
                  <button type="button" onClick={() => setChartSelectedTopic(null)}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}

              {chartSelectedNeed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F3FF] px-2 py-0.5 text-[11px] font-semibold text-[#6D28D9] border border-[#DDD6FE]">
                  <span>Issue: {chartSelectedNeed}</span>
                  <button type="button" onClick={() => setChartSelectedNeed(null)}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}

              {tableTopicFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569] border border-[#E2E8F0]">
                  <span>Topic filter: {tableTopicFilter}</span>
                  <button type="button" onClick={() => setTableTopicFilter("all")}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}

              {sourceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569] border border-[#E2E8F0]">
                  <span>Source: Used Web Search</span>
                  <button type="button" onClick={() => setSourceFilter("all")}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}

              {priorityFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569] border border-[#E2E8F0]">
                  <span>Priority: {priorityFilter}</span>
                  <button type="button" onClick={() => setPriorityFilter("all")}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569] border border-[#E2E8F0]">
                  <span>Keyword: &quot;{searchQuery}&quot;</span>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3 hover:text-[#B91C1C]" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[12px] font-semibold text-[#475569]">
                <th className="py-3 px-4 min-w-[240px]">Issue / Learning Need</th>
                <th className="py-3 px-3 w-[100px]">Priority</th>
                <th className="py-3 px-3 w-[110px] text-right">Total Answer</th>
                <th className="py-3 px-3 w-[110px] text-right">Web Assisted</th>
                <th className="py-3 px-3 w-[120px]">Web Ratio</th>
                <th className="py-3 px-4 min-w-[250px]">Suggested Action</th>
                              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[12.5px]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="h-8 w-8 text-[#CBD5E1]" />
                      <p className="font-semibold text-[#374151]">No content issues found matching current filters</p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Try clearing active filters or adjusting your search query.
                      </p>
                      {hasActiveTableFilters && (
                        <button
                          type="button"
                          onClick={clearAllTableFilters}
                          className="mt-2 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const webRatio = row.totalQuestions > 0 ? Math.round((row.webQuestions / row.totalQuestions) * 100) : 0;

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      {/* 1. Issue & Topic Subline */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A] leading-snug">{row.issue}</div>
                        <div className="text-[11.5px] text-[#64748B] mt-0.5">{row.topic}</div>
                      </td>

                      {/* 2. Priority */}
                      <td className="py-3 px-3">
                        {renderPriorityBadge(row.priority, row.priorityReason)}
                      </td>

                      {/* 3. Total Answer (clean number only, no subtext) */}
                      <td className="py-3 px-3 text-right font-semibold tabular-nums text-[#0F172A]">
                        {row.totalQuestions.toLocaleString()}
                      </td>

                      {/* 4. Web Assisted (clean number only, no icons, no subtext) */}
                      <td className="py-3 px-3 text-right font-semibold tabular-nums text-[#7C3AED]">
                        {row.webQuestions.toLocaleString()}
                      </td>

                      {/* 5. Web Ratio % */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, webRatio)}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${webRatio >= 60
                                ? "bg-[#DC2626]"
                                : webRatio >= 30
                                  ? "bg-[#D97706]"
                                  : "bg-[#059669]"
                                }`}
                            />
                          </div>
                          <span className="text-[11.5px] font-semibold tabular-nums text-[#475569] w-8 text-right">
                            {webRatio}%
                          </span>
                        </div>
                      </td>

                      {/* 6. Suggested Action (clean text, no icons) */}
                      <td className="py-3 px-4 text-[#334155] leading-relaxed">
                        {row.suggestedAction}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Strict Pagination (10 rows/page, Page 1/Page 2, NO view all button) */}
        {totalItems > 0 && (
          <div className="border-t border-[#F1F5F9] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[12px] text-[#64748B]">
              Showing <span className="font-semibold text-[#0F172A]">{totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-semibold text-[#0F172A]">{Math.min(currentPage * PAGE_SIZE, totalItems)}</span> of{" "}
              <span className="font-semibold text-[#0F172A]">{totalItems}</span> issues
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-[12px] font-semibold transition-colors ${isCurrent
                      ? "bg-[#2563EB] text-white"
                      : "border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F3F4F6]"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
