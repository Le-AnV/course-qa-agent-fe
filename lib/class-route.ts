export function classSectionFromPathname(pathname: string, basePath: string): string {
  const base = basePath.replace(/^\/+|\/+$/g, "");
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== base || parts[1] !== "class" || !parts[2] || !parts[3]) {
    return "overview";
  }
  // Keep the whole nested section (e.g. "quizzes/import"). Returning only the
  // first segment sent the sidebar class switcher to /quizzes, which has no
  // route and surfaced as a 404 when jumping between classes.
  return parts.slice(3).join("/");
}
