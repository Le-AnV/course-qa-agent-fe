"use client";

import React, { useSyncExternalStore } from "react";
import { GraduationCap } from "lucide-react";

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * CourseAiVisualPanel
 *
 * Clean, light, modern visual left panel for the Course AI login page.
 * Displays:
 * 1. Brand lockup (Course AI)
 * 2. Hero typography ("Your courses. / Clearer answers.")
 * 3. Compact animated U-shaped illustration:
 *    Course Materials (upper-left) -> Course AI (lower-center) -> Student (upper-right)
 */
export function CourseAiVisualPanel() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div
      className="w-full h-full flex flex-col justify-between py-10 lg:py-14 select-none overflow-hidden"
      style={{
        paddingLeft: "clamp(32px, 4.5vw, 80px)",
        paddingRight: "clamp(32px, 4.5vw, 80px)",
        background: "var(--brand-soft)",
      }}
    >
      {/* ============================================================== */}
      {/* AREA A: BRAND LOCKUP (Top edge aligned with hero text)         */}
      {/* ============================================================== */}
      <header className="flex items-center gap-3 shrink-0">
        <div
          className="w-[34px] h-[34px] rounded-[10px] border border-[#CFCFCF] bg-white flex items-center justify-center shadow-xs"
          aria-hidden="true"
        >
          <GraduationCap className="w-[18px] h-[18px] text-[#111111]" />
        </div>
        <span className="font-sans text-[17px] font-bold tracking-tight text-[#111111]">
          Course AI
        </span>
      </header>

      {/* ============================================================== */}
      {/* CENTER COMPOSITION: HERO TEXT (Above Midpoint) + ILLUSTRATION  */}
      {/* ============================================================== */}
      <div className="flex flex-col my-auto w-full max-w-[680px]">
        {/* AREA B: HERO HEADLINE & SUPPORTING SENTENCE */}
        <div className="text-left">
          <h1
            className="font-sans font-bold tracking-tight"
            style={{
              fontSize: "clamp(32px, 3vw, 48px)",
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            <span className="block text-[#111111]">Ask questions.</span>
            <span className="block text-[#111111] mt-1">
              Get answers from your <span className="inline-block whitespace-nowrap">course materials.</span>
            </span>
          </h1>

          <p
            className="text-[#5A5A5A] font-normal mt-4"
            style={{
              fontSize: "clamp(16px, 1.15vw, 18px)",
              lineHeight: 1.6,
            }}
          >
            Course AI helps you understand your syllabus and learning materials.
          </p>
        </div>

        {/* Clear space of at least 40px between hero text and illustration */}
        <div className="h-10 lg:h-12 shrink-0" aria-hidden="true" />

        {/* AREA C: LARGER HORIZONTAL WORKFLOW ILLUSTRATION (Enlarged, Centered, Modern Refined Aesthetic) */}
        <div className="w-full flex justify-center items-center py-2">
          <div
            className="w-full max-w-[660px] pointer-events-none select-none"
            style={{ aspectRatio: "660 / 210" }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 660 210"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label="Workflow illustration: Course materials travel into Course AI, which delivers a verified answer speech bubble to the student."
            >
              <defs>
                {/* Vibrant blue gradient for the AI answer speech bubble */}
                <linearGradient id="speechBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6F6F6F" />
                  <stop offset="60%" stopColor="#111111" />
                  <stop offset="100%" stopColor="#111111" />
                </linearGradient>

                {/* Soft gradient for student circular avatar */}
                <linearGradient id="studentBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F7F7F7" />
                  <stop offset="100%" stopColor="#F0F0F0" />
                </linearGradient>

                {/* Multi-layered soft shadow for Course AI card */}
                <filter
                  id="courseAiShadow"
                  x="-20%"
                  y="-20%"
                  width="145%"
                  height="155%"
                  filterUnits="userSpaceOnUse"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="14"
                    floodColor="#111111"
                    floodOpacity="0.09"
                  />
                </filter>

                {/* Subtle soft shadow for front materials document */}
                <filter
                  id="matDocShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                  filterUnits="userSpaceOnUse"
                >
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="6"
                    floodColor="#111111"
                    floodOpacity="0.07"
                  />
                </filter>

                {/* Subtle shadow for moving document */}
                <filter
                  id="movingDocShadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                  filterUnits="userSpaceOnUse"
                >
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="8"
                    floodColor="#111111"
                    floodOpacity="0.18"
                  />
                </filter>

                {/* Deep vibrant glow shadow for solid blue speech bubble */}
                <filter
                  id="speechBubbleShadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                  filterUnits="userSpaceOnUse"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="14"
                    floodColor="#111111"
                    floodOpacity="0.32"
                  />
                </filter>
              </defs>

              {/* ========================================================== */}
              {/* 1. HORIZONTAL CONNECTORS (Centerline y = 110, behind nodes)*/}
              {/* Equal 131px balanced gaps on both sides of Course AI.      */}
              {/* ========================================================== */}
              <g className="connectors" opacity="0.95">
                {/* Input connector: Materials (115, 110) -> Course AI (246, 110) */}
                <line
                  x1="115"
                  y1="110"
                  x2="246"
                  y2="110"
                  stroke="#CFCFCF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Output connector: Course AI (414, 110) -> Student (545, 110) */}
                <line
                  x1="414"
                  y1="110"
                  x2="545"
                  y2="110"
                  stroke="#CFCFCF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>

              {/* ========================================================== */}
              {/* 2. ANCHOR 1: COURSE MATERIALS (Center: 80, 110)            */}
              {/* Reformatted: crisp 3D stacked documents with blue pill tab */}
              {/* ========================================================== */}
              <g id="anchor-materials">
                {/* Refined label above anchor */}
                <text
                  x="80"
                  y="38"
                  textAnchor="middle"
                  fill="#5A5A5A"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="inherit"
                  letterSpacing="0.04em"
                >
                  Materials
                </text>

                {/* Sheet 1 (back sheet, tilted -7deg around 80, 111) */}
                <rect
                  x="60"
                  y="84"
                  width="40"
                  height="54"
                  rx="5"
                  fill="#DADADA"
                  opacity="0.75"
                  transform="rotate(-7 80 111)"
                />

                {/* Sheet 2 (middle sheet, tilted +5deg around 80, 110) */}
                <rect
                  x="60"
                  y="83"
                  width="40"
                  height="54"
                  rx="5"
                  fill="#F7F7F7"
                  stroke="#E2E2E2"
                  strokeWidth="1.2"
                  transform="rotate(5 80 110)"
                />

                {/* Sheet 3 (front sheet, upright, centered at 80, 110) */}
                <g filter="url(#matDocShadow)">
                  <path
                    d="M 65 82 H 89 L 101 94 V 132 A 6 6 0 0 1 95 138 H 65 A 6 6 0 0 1 59 132 V 88 A 6 6 0 0 1 65 82 Z"
                    fill="#FFFFFF"
                    stroke="#6F6F6F"
                    strokeWidth="1.4"
                  />
                  {/* Folded upper-right corner flap with blue accent */}
                  <path
                    d="M 89 82 V 94 H 101 Z"
                    fill="#F0F0F0"
                    stroke="#E2E2E2"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />

                  {/* Header category pill accent */}
                  <rect x="66" y="90" width="16" height="4" rx="2" fill="#6F6F6F" />

                  {/* Evenly spaced placeholder text lines */}
                  <line
                    x1="66"
                    y1="102"
                    x2="93"
                    y2="102"
                    stroke="#E2E2E2"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="66"
                    y1="110"
                    x2="90"
                    y2="110"
                    stroke="#DADADA"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="66"
                    y1="118"
                    x2="84"
                    y2="118"
                    stroke="#DADADA"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="66"
                    y1="126"
                    x2="76"
                    y2="126"
                    stroke="#DADADA"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* ========================================================== */}
              {/* 3. ANCHOR 2: COURSE AI (Center: 330, 110 | Size: 168 x 80) */}
              {/* Icon updated to TWO CONVERSATION BUBBLES beside Course AI  */}
              {/* ========================================================== */}
              <g id="anchor-course-ai">
                {/* White rounded card with processing pulse animation */}
                <rect
                  x="246"
                  y="70"
                  width="168"
                  height="80"
                  rx="18"
                  fill="#FFFFFF"
                  stroke="#CFCFCF"
                  strokeWidth="1.75"
                  filter="url(#courseAiShadow)"
                >
                  {!reducedMotion && (
                    <>
                      {/* Pulse border: 1.8s - 2.5s (24.0% to 33.3%) */}
                      <animate
                        attributeName="stroke"
                        dur="7.5s"
                        repeatCount="indefinite"
                        keyTimes="0; 0.240; 0.286; 0.333; 1"
                        values="#CFCFCF; #CFCFCF; #6F6F6F; #CFCFCF; #CFCFCF"
                      />
                      <animate
                        attributeName="stroke-width"
                        dur="7.5s"
                        repeatCount="indefinite"
                        keyTimes="0; 0.240; 0.286; 0.333; 1"
                        values="1.75; 1.75; 2.5; 1.75; 1.75"
                      />
                    </>
                  )}
                </rect>

                {/* Content centered inside block: TWO CONVERSATION BUBBLES + Course AI text */}
                <g transform="translate(330, 110)">
                  {/* Two conversation speech bubbles (pulsing during processing) */}
                  <g transform="translate(0, 0)">
                    {!reducedMotion && (
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        dur="7.5s"
                        repeatCount="indefinite"
                        additive="sum"
                        keyTimes="0; 0.240; 0.286; 0.333; 1"
                        values="1; 1; 1.15; 1; 1"
                      />
                    )}

                    {/* Back conversation bubble (smaller, lighter blue, top-right) */}
                    <path
                      d="M -38 -15 H -24 A 4.5 4.5 0 0 1 -19.5 -10.5 V -4.5 A 4.5 4.5 0 0 1 -24 0 H -30 L -35 4 V 0 H -38 A 4.5 4.5 0 0 1 -42.5 -4.5 V -10.5 A 4.5 4.5 0 0 1 -38 -15 Z"
                      fill="#E2E2E2"
                      stroke="#6F6F6F"
                      strokeWidth="1"
                    />

                    {/* Front conversation bubble (primary, brand blue, bottom-left) */}
                    <path
                      d="M -47 -8 H -29 A 5 5 0 0 1 -24 -3 V 4 A 5 5 0 0 1 -29 9 H -38 L -44 14 V 9 H -47 A 5 5 0 0 1 -52 4 V -3 A 5 5 0 0 1 -47 -8 Z"
                      fill="#111111"
                    />
                    {/* Two tiny white chat lines inside the front bubble */}
                    <line
                      x1="-46"
                      y1="-1.5"
                      x2="-32"
                      y2="-1.5"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="-46"
                      y1="3.5"
                      x2="-37"
                      y2="3.5"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Course AI label */}
                  <text
                    x="-14"
                    y="6"
                    fill="#111111"
                    fontSize="16"
                    fontWeight="700"
                    fontFamily="inherit"
                    letterSpacing="-0.01em"
                  >
                    Course AI
                  </text>
                </g>
              </g>

              {/* ========================================================== */}
              {/* 4. ANCHOR 3: USER / STUDENT (Center: 580, 110)             */}
              {/* Reformatted: beautiful dual-ring container & clean avatar  */}
              {/* ========================================================== */}
              <g id="anchor-student">
                {/* Refined label above anchor */}
                <text
                  x="580"
                  y="38"
                  textAnchor="middle"
                  fill="#5A5A5A"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="inherit"
                  letterSpacing="0.04em"
                >
                  Student
                </text>

                {/* Expanding acknowledgement pulse ring (5.2s - 5.8s: 69.3% to 77.3%) */}
                {!reducedMotion && (
                  <circle
                    cx="580"
                    cy="110"
                    r="30"
                    fill="none"
                    stroke="#6F6F6F"
                    strokeWidth="1.75"
                    opacity="0"
                  >
                    <animate
                      attributeName="r"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.693; 0.707; 0.773; 1"
                      values="30; 30; 32; 45; 30"
                    />
                    <animate
                      attributeName="opacity"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.693; 0.707; 0.773; 1"
                      values="0; 0; 0.7; 0; 0"
                    />
                    <animate
                      attributeName="stroke-width"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.693; 0.707; 0.773; 1"
                      values="1.75; 1.75; 2; 0.6; 1.75"
                    />
                  </circle>
                )}

                {/* Outer pale blue circular avatar container (diameter 60px) */}
                <circle
                  cx="580"
                  cy="110"
                  r="30"
                  fill="url(#studentBgGrad)"
                  stroke="#CFCFCF"
                  strokeWidth="1.75"
                />

                {/* Subtle inner delicate ring */}
                <circle
                  cx="580"
                  cy="110"
                  r="26"
                  fill="none"
                  stroke="#F0F0F0"
                  strokeWidth="1"
                  opacity="0.8"
                />

                {/* Clean user silhouette in brand blue */}
                {/* Head */}
                <circle
                  cx="580"
                  cy="101"
                  r="7.5"
                  fill="#111111"
                />
                {/* Contoured shoulders */}
                <path
                  d="M 566 123 C 566 114 572 111 580 111 C 588 111 594 114 594 123 C 594 124.5 593 125 591.5 125 H 568.5 C 567 125 566 124.5 566 123 Z"
                  fill="#111111"
                />
              </g>

              {/* ========================================================== */}
              {/* 5. TRAVELLING DOCUMENT ICON (0.5s - 1.8s: 6.7% - 24.0%)    */}
              {/* Enlarged portrait sheet (28 x 38px) with folded corner     */}
              {/* travelling along horizontal centerline from 105 to 246.    */}
              {/* ========================================================== */}
              {!reducedMotion && (
                <g opacity="0" filter="url(#movingDocShadow)">
                  {/* Position along straight horizontal input path */}
                  <animateMotion
                    dur="7.5s"
                    repeatCount="indefinite"
                    rotate="0"
                    path="M 105 110 L 246 110"
                    keyTimes="0; 0.067; 0.240; 1"
                    keyPoints="0; 0; 1; 1"
                    calcMode="linear"
                  />

                  {/* Fade in at departure (0.5s-0.7s), fade out into AI (1.6s-1.8s) */}
                  <animate
                    attributeName="opacity"
                    dur="7.5s"
                    repeatCount="indefinite"
                    keyTimes="0; 0.067; 0.093; 0.213; 0.240; 1"
                    values="0; 0; 1; 1; 0; 0"
                  />

                  {/* Portrait document (28 x 38px, centered at 0, 0) */}
                  <g transform="translate(0, 0)">
                    {/* Sheet with folded upper-right corner */}
                    <path
                      d="M -12 -19 H 5 L 14 -10 V 17 A 3 3 0 0 1 11 20 H -12 A 3 3 0 0 1 -15 17 V -16 A 3 3 0 0 1 -12 -19 Z"
                      fill="#FFFFFF"
                      stroke="#111111"
                      strokeWidth="1.6"
                    />
                    {/* Folded corner flap */}
                    <path
                      d="M 5 -19 V -10 H 14 Z"
                      fill="#F0F0F0"
                      stroke="#111111"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />

                    {/* Category pill accent */}
                    <rect x="-9" y="-13" width="10" height="3" rx="1.5" fill="#6F6F6F" />

                    {/* Evenly spaced text lines */}
                    <line
                      x1="-9"
                      y1="-5"
                      x2="6"
                      y2="-5"
                      stroke="#E2E2E2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <line
                      x1="-9"
                      y1="2"
                      x2="4"
                      y2="2"
                      stroke="#E2E2E2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <line
                      x1="-9"
                      y1="9"
                      x2="1"
                      y2="9"
                      stroke="#E2E2E2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <line
                      x1="-9"
                      y1="14"
                      x2="-3"
                      y2="14"
                      stroke="#E2E2E2"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              )}

              {/* ========================================================== */}
              {/* 6. TRAVELLING AI ANSWER — ENLARGED BLUE SPEECH BUBBLE      */}
              {/* Size ~96 x 56px with distinct lower-left tail pointing     */}
              {/* strictly back at Course AI. White AI sparkle + 3 lines.    */}
              {/* ========================================================== */}
              {!reducedMotion && (
                <g opacity="0" filter="url(#speechBubbleShadow)">
                  {/* Motion: emerges at 460, holds while strokes appear, glides to 535 */}
                  <animateMotion
                    dur="7.5s"
                    repeatCount="indefinite"
                    rotate="0"
                    path="M 460 110 L 460 110 L 535 110 L 535 110"
                    keyTimes="0; 0.333; 0.440; 0.627; 1"
                    keyPoints="0; 0; 0; 1; 1"
                    calcMode="linear"
                  />

                  {/* Fade in at AI emergence (2.5s-2.7s), fade out at Student (4.7s-5.2s) */}
                  <animate
                    attributeName="opacity"
                    dur="7.5s"
                    repeatCount="indefinite"
                    keyTimes="0; 0.333; 0.360; 0.627; 0.693; 1"
                    values="0; 0; 1; 1; 0; 0"
                  />

                  {/* Scale: emerges smoothly, then shrinks slightly as it enters Student */}
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    dur="7.5s"
                    repeatCount="indefinite"
                    keyTimes="0; 0.333; 0.360; 0.627; 0.693; 1"
                    values="0.75; 0.75; 1; 1; 0.68; 0.68"
                  />

                  {/* ENLARGED SPEECH BUBBLE SILHOUETTE (96 x 56px including tail) */}
                  {/* Tail at lower-left strictly points back toward Course AI */}
                  <path
                    d="M -26 -26 H 34 A 14 14 0 0 1 48 -12 V 6 A 14 14 0 0 1 34 20 H -12 L -48 30 Q -34 23 -28 20 A 14 14 0 0 1 -40 6 V -12 A 14 14 0 0 1 -26 -26 Z"
                    fill="url(#speechBubbleGrad)"
                  />

                  {/* White AI sparkle at top-left inside bubble */}
                  <path
                    d="M -22 -18 C -22 -15 -24.2 -12.5 -27.5 -12.5 C -24.2 -12.5 -22 -10 -22 -7 C -22 -10 -19.8 -12.5 -16.5 -12.5 C -19.8 -12.5 -22 -15 -22 -18 Z"
                    fill="#FFFFFF"
                  />

                  {/* Three short white content strokes appearing in quick succession */}
                  {/* Stroke 1 (thicker, top stroke, reveals at 2.7s / 36.0%) */}
                  <line
                    x1="-10"
                    y1="-12.5"
                    x2="34"
                    y2="-12.5"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="opacity"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.360; 0.380; 0.693; 1"
                      values="0; 0; 1; 1; 0"
                    />
                  </line>

                  {/* Stroke 2 (longer middle stroke, reveals at 2.9s / 38.7%) */}
                  <line
                    x1="-28"
                    y1="-1"
                    x2="36"
                    y2="-1"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.95"
                  >
                    <animate
                      attributeName="opacity"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.387; 0.407; 0.693; 1"
                      values="0; 0; 0.95; 0.95; 0"
                    />
                  </line>

                  {/* Stroke 3 (shorter bottom stroke, reveals at 3.1s / 41.3%) */}
                  <line
                    x1="-28"
                    y1="10"
                    x2="12"
                    y2="10"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  >
                    <animate
                      attributeName="opacity"
                      dur="7.5s"
                      repeatCount="indefinite"
                      keyTimes="0; 0.413; 0.433; 0.693; 1"
                      values="0; 0; 0.9; 0.9; 0"
                    />
                  </line>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Subtle bottom spacer for optical balance without page scroll */}
      <div className="h-4 lg:h-6 shrink-0" aria-hidden="true" />
    </div>
  );
}

export default CourseAiVisualPanel;
