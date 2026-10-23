const SEMESTER_DATES: Record<string, { start: string; end: string }> = {
  Spring: { start: "01/01", end: "30/04" },
  Summer: { start: "01/05", end: "31/08" },
  Fall: { start: "01/09", end: "31/12" },
};

export function semesterDateRange(semester: string, academicYear: string): string | null {
  const dates = SEMESTER_DATES[semester];
  if (!dates) return null;

  const year = /^\d{4}$/.test(academicYear.trim()) ? academicYear.trim() : "";
  const start = year ? `${dates.start}/${year}` : dates.start;
  const end = year ? `${dates.end}/${year}` : dates.end;
  return `${start} – ${end}`;
}
