export function classSectionFromPathname(pathname: string, basePath: string): string {
  const base = basePath.replace(/^\/+|\/+$/g, "");
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== base || parts[1] !== "class" || !parts[2] || !parts[3]) {
    return "overview";
  }
  return parts[3];
}
