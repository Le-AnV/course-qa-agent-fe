import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessRoute, homeRouteFor, type Role, AUTH_ROLE_KEY } from './components/ui/nav-config';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/styleguide'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, Next.js internal files, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get role from cookie (set during login)
  const roleCookie = request.cookies.get(AUTH_ROLE_KEY)?.value as Role | undefined;

  // 1. Unauthenticated user trying to access ANY route (including '/')
  if (!roleCookie && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user
  if (roleCookie) {
    // If they try to go to the login page (or root), redirect to their home
    if (pathname === '/' || pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = homeRouteFor(roleCookie);
      return NextResponse.redirect(url);
    }

    // Check if their role allows them to access this specific path
    const hasAccess = canAccessRoute(roleCookie, pathname);
    if (!hasAccess) {
      // Redirect to their default home page if unauthorized
      const url = request.nextUrl.clone();
      url.pathname = homeRouteFor(roleCookie);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Config to specify which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
