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
  const [statusFilter, setStatusFilter] = React.useState<"all" | IssueStatus>("all");

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
            const isEnrichment = pat.scope_type === "enrichment" ||
              /vulkan|opengl|directx|unreal|game engine|thư viện đồ họa|ngôn ngữ khác|ngoài đề cương/i.test(pat.pattern);

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
            const status: IssueStatus =
              web === 0
                ? "Covered"
                : (ratio >= 0.3 && web >= 2) || ratio >= 0.5
                ? "Missing Material"
                : "Needs Review";

            records.push({
              id: `real-${topic.category_id}-rg-${idx}`,
              issue: rg.title,
              topic: topic.category_name,
              priority:
                topic.status === "critical"
                  ? "High"
                  : topic.status === "warning"
                  ? "Medium"
                  : "Low",
              priorityReason:
                rg.explanation ||
                (rg.questions.length > 0
                  ? `Recent query: "${rg.questions[0].question}"`
                  : `Topic health: ${topic.status}`),
              totalQuestions: total,
              webQuestions: web,
              suggestedAction:
                topic.curriculum_gap?.recommendation ||
                "Review and expand course materials for this section.",
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

  // --- B. LEFT CHART DATA (Total student inquiries grouped by general topic, sorted desc) ---
  const leftChartData = React.useMemo(() => {
    const topicMap = new Map<string, number>();
    baseData.forEach((item) => {
      topicMap.set(item.topic, (topicMap.get(item.topic) ?? 0) + item.totalQuestions);
    });

    const sorted = Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const totalTopicsCount = sorted.length;
    const top5 = sorted.slice(0, 5);
    const maxCount = top5.length > 0 ? Math.max(...top5.map((t) => t.count)) : 1;

    return { top5, totalTopicsCount, maxCount };
  }, [baseData]);

  // --- B. RIGHT CHART DATA (Web-assisted inquiries grouped by specific issue/need, sorted desc) ---
  const rightChartData = React.useMemo(() => {
    const needMap = new Map<string, { count: number; topic: string }>();
    baseData.forEach((item) => {
      if (item.webQuestions > 0) {
        needMap.set(item.issue, {
          count: item.webQuestions,
          topic: item.topic,
        });
      }
    });

    const sorted = Array.from(needMap.entries())
      .map(([need, info]) => ({ need, count: info.count, topic: info.topic }))
      .sort((a, b) => b.count - a.count);

    const totalNeedsCount = sorted.length;
    const top5 = sorted.slice(0, 5);
    const maxCount = top5.length > 0 ? Math.max(...top5.map((n) => n.count)) : 1;

    return { top5, totalNeedsCount, maxCount };
  }, [baseData]);

  // --- FILTERED TABLE DATA ---
  const filteredTableData = React.useMemo(() => {
    return baseData.filter((item) => {
      if (chartSelectedTopic && item.topic !== chartSelectedTopic) return false;
      if (chartSelectedNeed && item.issue !== chartSelectedNeed) return false;
      if (tableTopicFilter !== "all" && item.topic !== tableTopicFilter) return false;
      if (sourceFilter === "web" && item.webQuestions === 0) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

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
    statusFilter,
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
    statusFilter,
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

  // --- CHART INTERACTION HANDLERS ---
  const handleLeftBarClick = (topicName: string) => {
    if (chartSelectedTopic === topicName) {
      setChartSelectedTopic(null);
    } else {
      setChartSelectedTopic(topicName);
    }
  };

  const handleRightBarClick = (needName: string) => {
    if (chartSelectedNeed === needName) {
      setChartSelectedNeed(null);
    } else {
      setChartSelectedNeed(needName);
      setSourceFilter("web");
    }
  };

  const clearAllTableFilters = () => {
    setChartSelectedTopic(null);
    setChartSelectedNeed(null);
    setSearchQuery("");
    setTableTopicFilter("all");
    setSourceFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
  };

  const hasActiveTableFilters =
    Boolean(chartSelectedTopic) ||
    Boolean(chartSelectedNeed) ||
    searchQuery.trim() !== "" ||
    tableTopicFilter !== "all" ||
    sourceFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "all";

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

  // Status badge styling (modern, elegant pill badge with soft dot indicator)
  const renderStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "Missing Material":
        return (
          <span
            title="High web fallback ratio; requires supplemental course materials."
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-200/80 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Missing Material
          </span>
        );
      case "Needs Review":
        return (
          <span
            title="Moderate web search; review clarity or practical examples in materials."
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/80 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Needs Review
          </span>
        );
      case "Optional":
      case "Enrichment":
        return (
          <span
            title="Kiến thức tự chọn / sinh viên tự tìm hiểu thêm ngoài đề cương chính khóa."
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200/80 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Optional
          </span>
        );
      case "Covered":
        return (
          <span
            title="Directly answered from internal course materials (0% web fallback)."
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Covered
          </span>
        );
      case "Resolved":
      default:
        return (
          <span
            title="Instructor has supplemented course materials for this topic."
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/80 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
    }
  };

  // All unique topics for the dropdown (strictly scoped to this course)
  const uniqueTopics = React.useMemo(() => {
    const set = new Set<string>();
    issuesData.forEach((i) => set.add(i.topic));
    return Array.from(set);
  }, [issuesData]);

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
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Time:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "30d" | "7d" | "90d" | "semester")}
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer"
              >
                <option value="30d">Last 30 Days</option>
                <option value="7d">Last 7 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="semester">Full Semester</option>
              </select>
            </div>

            {/* Material Set */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Materials:</span>
              <select
                value={selectedMaterialSet}
                onChange={(e) =>
                  setSelectedMaterialSet(e.target.value as "all" | "lecture" | "lab" | "policies")
                }
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer"
              >
                <option value="all">All Material Sets</option>
                <option value="lecture">Lecture Notes & Materials</option>
                <option value="lab">Lab Guides & Exercises</option>
                <option value="policies">Syllabus & Policies</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* B. TWO CHARTS (Side-by-side on desktop, stacked on mobile, equal height)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* --- LEFT CHART: WHAT ARE STUDENTS ASKING? --- */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">What are students asking?</h3>
                <p className="text-[12px] text-[#64748B]">Top 5 topics by question count</p>
              </div>
              <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE]">
                All Questions
              </span>
            </div>

            {/* Bars List */}
            <div className="space-y-3 pt-2">
              {leftChartData.top5.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                  No student questions recorded for this scope.
                </div>
              ) : (
                leftChartData.top5.map((item) => {
                  const isSelected = chartSelectedTopic === item.topic;
                  const pct = Math.max(8, Math.round((item.count / leftChartData.maxCount) * 100));

                  return (
                    <div
                      key={item.topic}
                      onClick={() => handleLeftBarClick(item.topic)}
                      title={`Click to filter table by topic: ${item.topic} (${item.count.toLocaleString()} inquiries)`}
                      className={`group flex items-center gap-2.5 sm:gap-3.5 cursor-pointer rounded-xl p-2 transition-all border ${
                        isSelected
                          ? "bg-[#EFF6FF] border-[#BFDBFE] ring-2 ring-[#3B82F6]/30 shadow-xs"
                          : "border-transparent hover:bg-[#F8FAFC] hover:border-[#E2E8F0]"
                      }`}
                    >
                      {/* Fixed Label Zone */}
                      <div className="w-[130px] sm:w-[165px] shrink-0 text-right pr-1">
                        <span
                          title={item.topic}
                          className={`block truncate text-[12.5px] sm:text-[13px] transition-colors ${
                            isSelected
                              ? "text-[#1D4ED8] font-bold"
                              : "text-[#1E293B] font-semibold group-hover:text-[#0F172A]"
                          }`}
                        >
                          {item.topic}
                        </span>
                      </div>

                      {/* Bar Track + Bar */}
                      <div className="relative flex-1 h-7 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]/70 overflow-hidden flex items-center p-0.5">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-md transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] shadow-xs"
                              : "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] group-hover:from-[#1D4ED8] group-hover:to-[#2563EB]"
                          }`}
                        />
                      </div>

                      {/* Inquiry Count Badge (Dedicated slot, right next to bar, high-contrast) */}
                      <div className="w-14 sm:w-16 shrink-0 text-right">
                        <span
                          className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md text-[12px] font-bold tabular-nums transition-colors ${
                            isSelected
                              ? "bg-[#1D4ED8] text-white shadow-xs"
                              : "bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] group-hover:bg-[#EFF6FF] group-hover:text-[#1D4ED8] group-hover:border-[#BFDBFE]"
                          }`}
                        >
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scale info + Scope counter (Informational, NOT a button) */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Scale: Total answer count</span>
            <span className="font-medium text-[#64748B]">
              Showing {leftChartData.top5.length} of {leftChartData.totalTopicsCount} topics
            </span>
          </div>
        </div>

        {/* --- RIGHT CHART: CONTENT REQUIRING WEB SEARCH --- */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">Content requiring web search</h3>
                <p className="text-[12px] text-[#64748B]">Top 5 content groups by web fallback</p>
              </div>
              <span className="text-[11px] font-semibold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#DDD6FE]">
                Used Web Search
              </span>
            </div>

            {/* Bars List */}
            <div className="space-y-3 pt-2">
              {rightChartData.top5.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                  No web search fallbacks recorded for this scope.
                </div>
              ) : (
                rightChartData.top5.map((item) => {
                  const isSelected = chartSelectedNeed === item.need;
                  const pct = Math.max(8, Math.round((item.count / rightChartData.maxCount) * 100));

                  return (
                    <div
                      key={item.need}
                      onClick={() => handleRightBarClick(item.need)}
                      title={`Click to filter table by issue: ${item.need} (${item.count.toLocaleString()} web inquiries)`}
                      className={`group flex items-center gap-2.5 sm:gap-3.5 cursor-pointer rounded-xl p-2 transition-all border ${
                        isSelected
                          ? "bg-[#FAF5FF] border-[#E9D5FF] ring-2 ring-[#7C3AED]/30 shadow-xs"
                          : "border-transparent hover:bg-[#F8FAFC] hover:border-[#E2E8F0]"
                      }`}
                    >
                      {/* Fixed Label Zone */}
                      <div className="w-[130px] sm:w-[165px] shrink-0 text-right pr-1">
                        <span
                          title={item.need}
                          className={`block truncate text-[12.5px] sm:text-[13px] transition-colors ${
                            isSelected
                              ? "text-[#6D28D9] font-bold"
                              : "text-[#1E293B] font-semibold group-hover:text-[#0F172A]"
                          }`}
                        >
                          {item.need}
                        </span>
                      </div>

                      {/* Bar Track + Bar */}
                      <div className="relative flex-1 h-7 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]/70 overflow-hidden flex items-center p-0.5">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-md transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] shadow-xs"
                              : "bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] group-hover:from-[#6D28D9] group-hover:to-[#7C3AED]"
                          }`}
                        />
                      </div>

                      {/* Web Inquiries Count Badge */}
                      <div className="w-14 sm:w-16 shrink-0 text-right">
                        <span
                          className={`inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md text-[12px] font-bold tabular-nums transition-colors ${
                            isSelected
                              ? "bg-[#7C3AED] text-white shadow-xs"
                              : "bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] group-hover:bg-[#FAF5FF] group-hover:text-[#6D28D9] group-hover:border-[#E9D5FF]"
                          }`}
                        >
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scale info + Scope counter (Informational, NOT a button) */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Scale: Web fallback inquiries count</span>
            <span className="font-medium text-[#64748B]">
              Showing {rightChartData.top5.length} of {rightChartData.totalNeedsCount} content groups
            </span>
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
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Topic:</span>
              <select
                value={tableTopicFilter}
                onChange={(e) => setTableTopicFilter(e.target.value)}
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as "all" | "web")}
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer"
              >
                <option value="all">All Answers</option>
                <option value="web">Used Web Search</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as "all" | PriorityLevel)}
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Info">Info</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-[12px]">
              <span className="text-[#9CA3AF] text-[11.5px] font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | IssueStatus)}
                className="bg-transparent font-medium text-[#374151] focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Missing Material">Missing Material</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Optional">Optional</option>
                <option value="Covered">Covered</option>
                <option value="Resolved">Resolved</option>
              </select>
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

              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569] border border-[#E2E8F0]">
                  <span>Status: {statusFilter}</span>
                  <button type="button" onClick={() => setStatusFilter("all")}>
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
                <th className="py-3 px-4 w-[130px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[12.5px]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
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
                              className={`h-full rounded-full transition-all duration-300 ${
                                webRatio >= 60
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

                      {/* 7. Status */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(row.status)}
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
                    className={`h-8 w-8 rounded-lg text-[12px] font-semibold transition-colors ${
                      isCurrent
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
