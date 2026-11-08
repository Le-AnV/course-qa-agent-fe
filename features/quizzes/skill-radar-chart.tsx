"use client";

import * as React from "react";
import { AlertTriangle, Award, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SkillMasteryRadarItem } from "@/lib/student-quiz-api";

interface SkillRadarChartProps {
  radarItems: SkillMasteryRadarItem[];
}

const LEVEL_META: Record<
  string,
  { label: string; bg: string; border: string; text: string; ringPercent: number }
> = {
  NOVICE: {
    label: "Novice",
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-800",
    ringPercent: 20,
  },
  BEGINNER: {
    label: "Beginner",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    ringPercent: 40,
  },
  COMPETENT: {
    label: "Competent",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    ringPercent: 60,
  },
  PROFICIENT: {
    label: "Proficient",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    ringPercent: 80,
  },
  MASTER: {
    label: "Master",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    ringPercent: 100,
  },
};

export function SkillRadarChart({ radarItems }: SkillRadarChartProps) {
  if (!radarItems || radarItems.length === 0) {
    return null;
  }

  const size = 360;
  const center = size / 2;
  const radius = 120;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const count = radarItems.length;

  // Compute radar coordinates
  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = radius * Math.max(0.05, Math.min(1.0, ratio));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = radius + 28;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Build grid concentric rings
  const gridPolygons = levels.map((ratio) => {
    return Array.from({ length: count })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });

  // Build student score polygon
  const scorePolygon = radarItems
    .map((item, i) => {
      const ratio = (item.percentage || 0) / 100;
      const { x, y } = getCoordinates(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const hasAnyGap = radarItems.some(
    (item) => item.foundation_gaps && item.foundation_gaps.length > 0,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Competency Skill Radar Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated using the Dreyfus Model of Skill Acquisition & Gated Competency Assessment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
            {count} Skill{count > 1 ? "s" : ""} Assessed
          </Badge>
        </div>
      </div>

      {hasAnyGap && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-semibold">Foundation Gap Alert Detected</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              One or more skills have a prerequisite foundation gap: questions at higher difficulty
              levels were answered correctly, but foundational novice-level questions were missed.
              Review the detailed breakdown below to reinforce core concepts.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar SVG Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          {count >= 3 ? (
            <div className="relative">
              <svg width={size} height={size} className="overflow-visible select-none">
                {/* Background circles / polygons */}
                {gridPolygons.map((points, idx) => (
                  <polygon
                    key={idx}
                    points={points}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth={idx === levels.length - 1 ? "1.5" : "1"}
                    strokeDasharray={idx < levels.length - 1 ? "3 3" : undefined}
                  />
                ))}

                {/* Axes from center */}
                {radarItems.map((_, i) => {
                  const { x, y } = getCoordinates(i, 1.0);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Student Score Polygon */}
                <polygon
                  points={scorePolygon}
                  fill="rgba(79, 70, 229, 0.18)"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {radarItems.map((item, i) => {
                  const ratio = (item.percentage || 0) / 100;
                  const { x, y } = getCoordinates(i, ratio);
                  const isGap = item.foundation_gaps && item.foundation_gaps.length > 0;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isGap ? "5.5" : "4.5"}
                      fill={isGap ? "#D97706" : "#4F46E5"}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Skill Labels */}
                {radarItems.map((item, i) => {
                  const { x, y } = getLabelCoordinates(i);
                  const isRight = x > center + 10;
                  const isLeft = x < center - 10;
                  const textAnchor = isRight ? "start" : isLeft ? "end" : "middle";
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      className="text-[11px] font-semibold fill-slate-700"
                    >
                      {item.skill_code}
                    </text>
                  );
                })}
              </svg>
              <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" /> Mastery Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Foundation Gap
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 py-4 px-2">
              <div className="text-center text-xs text-slate-500 mb-2">
                Linear Mastery Distribution
              </div>
              {radarItems.map((item) => (
                <div key={item.skill_code} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {item.skill_name || item.skill_code}
                    </span>
                    <span className="font-bold text-indigo-600">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Skill Mastery List */}
        <div className="lg:col-span-7 space-y-3.5">
          {radarItems.map((item) => {
            const levelInfo = item.achieved_level ? LEVEL_META[item.achieved_level] : null;
            const hasGaps = item.foundation_gaps && item.foundation_gaps.length > 0;
            return (
              <div
                key={item.skill_code}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.skill_name || item.skill_code}
                      </h4>
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.skill_code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasGaps && (
                      <Badge
                        variant="outline"
                        className="text-[10.5px] border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1 py-0.5"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> Gap Alert
                      </Badge>
                    )}
                    {levelInfo ? (
                      <Badge
                        className={`text-[11px] font-semibold border ${levelInfo.bg} ${levelInfo.border} ${levelInfo.text} shadow-none`}
                      >
                        {levelInfo.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-200">
                        Below Novice
                      </Badge>
                    )}
                    <span className="text-xs font-bold text-slate-700 ml-1">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Level Breakdown Grid */}
                {item.breakdown && Object.keys(item.breakdown).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                    {["NOVICE", "BEGINNER", "COMPETENT", "PROFICIENT", "MASTER"].map((lvl) => {
                      const breakdown = item.breakdown[lvl];
                      const meta = LEVEL_META[lvl];
                      if (!breakdown) {
                        return (
                          <div
                            key={lvl}
                            className="rounded border border-dashed border-slate-200 bg-white/40 p-1.5 text-center opacity-40"
                          >
                            <span className="text-[10px] font-medium text-slate-400">
                              {meta.label}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">—</div>
                          </div>
                        );
                      }
                      const passed = breakdown.passed;
                      const accuracy =
                        breakdown.rate != null
                          ? Math.round(breakdown.rate * 100)
                          : breakdown.max > 0
                            ? Math.round((breakdown.earned / breakdown.max) * 100)
                            : 0;
                      return (
                        <div
                          key={lvl}
                          className={`rounded border p-1.5 text-center ${
                            passed
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`text-[10.5px] font-semibold ${
                                passed ? "text-emerald-800" : "text-slate-600"
                              }`}
                            >
                              {meta.label}
                            </span>
                            {passed ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-slate-300" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {breakdown.earned}/{breakdown.max} ({accuracy}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
